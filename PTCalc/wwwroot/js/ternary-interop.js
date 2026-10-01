// Üçgen faz diyagramı sayfası: tarayıcıda saklama ve dosya indirme yardımcıları.
// Blazor Server'da dosya indirmek için JS gerekir (sunucu tarafında Blob yok);
// localStorage da yalnız tarayıcıda var.
window.ternaryStore = {
    save: function (key, json) {
        try { localStorage.setItem(key, json); return true; } catch (e) { return false; }
    },
    load: function (key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    remove: function (key) {
        try { localStorage.removeItem(key); } catch (e) { /* yoksay */ }
    },

    downloadText: function (filename, text, mime) {
        const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    },

    // Ekrandaki SVG'yi tek başına açılabilir bir dosyaya çevirir. Sayfadaki SVG tema
    // renklerini CSS değişkenlerinden (class ile) alıyor; dosyada CSS olmayacağı için
    // hesaplanmış renkler öznitelik olarak gömülür, zemin için de bir dikdörtgen eklenir.
    exportSvgString: function (elementId) {
        const svg = document.getElementById(elementId);
        if (!svg) return null;

        const clone = svg.cloneNode(true);
        const src = svg.querySelectorAll('*');
        const dst = clone.querySelectorAll('*');
        for (let i = 0; i < src.length; i++) {
            if (src[i].classList && src[i].classList.length > 0) {
                const cs = getComputedStyle(src[i]);
                if (cs.fill && cs.fill !== 'none') dst[i].setAttribute('fill', cs.fill);
                if (cs.stroke && cs.stroke !== 'none') dst[i].setAttribute('stroke', cs.stroke);
                dst[i].removeAttribute('class');
            }
        }

        const vb = svg.viewBox && svg.viewBox.baseVal;
        const w = vb && vb.width ? vb.width : svg.clientWidth;
        const h = vb && vb.height ? vb.height : svg.clientHeight;
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clone.setAttribute('width', String(w));
        clone.setAttribute('height', String(h));
        clone.removeAttribute('class');
        clone.removeAttribute('style');
        clone.removeAttribute('id');

        const bg = getComputedStyle(svg).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', '0'); rect.setAttribute('y', '0');
            rect.setAttribute('width', String(w)); rect.setAttribute('height', String(h));
            rect.setAttribute('fill', bg);
            clone.insertBefore(rect, clone.firstChild);
        }

        // Blazor'un olay dinleyici izleri dosyada anlamsız
        clone.querySelectorAll('[_bl_]').forEach(function (el) { el.removeAttribute('_bl_'); });
        Array.prototype.forEach.call(clone.querySelectorAll('*'), function (el) {
            Array.prototype.slice.call(el.attributes).forEach(function (a) {
                if (a.name.indexOf('_bl_') === 0 || a.name.indexOf('blazor:') === 0) el.removeAttribute(a.name);
            });
        });

        return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
    },

    downloadSvg: function (elementId, filename) {
        const xml = window.ternaryStore.exportSvgString(elementId);
        if (!xml) return false;
        window.ternaryStore.downloadText(filename, xml, 'image/svg+xml;charset=utf-8');
        return true;
    }
};

// Diyagramın görünen bölgesi: imleç göstergesi, Ctrl/⌘ + tekerlekle yakınlaştırma (dokunmatik
// yüzeyde kıstırma da böyle gelir) ve yakınlaştırılmışken sürükleyerek kaydırma.
//
// Görünen bölge = her bileşenin alt sınırı (yüzde), TernaryRange ile aynı. Blazor çizdiği aralığı
// SVG'nin data-range özniteliğine yazar ("rendered"). Hareket sırasında burada bir hedef aralık
// ("target") tutulur; içerik katmanlarına (.ternary-pan) rendered → target benzerlik dönüşümü
// verilir, böylece görüntü hemen tepki verir. Hedef seyrek olarak sunucuya bildirilir (hareket
// durunca 150 ms sonra, sürerken en fazla 300 ms'de bir); sunucu eksenleri yeni aralıkla çizince
// dönüşüm kendiliğinden sıfıra iner. Düz tekerlek sayfayı kaydırmaya devam eder.
//
// opts: { hint, left, bottom, side } — çerçeve üçgeninin sol alt köşesi ve kenarı (SVG birimi).
window.ternaryView = {
    attach: function (svgId, wrapId, dotnet, opts) {
        const svg = document.getElementById(svgId);
        const wrap = document.getElementById(wrapId);
        if (!svg || !wrap || !opts || !opts.side || svg.__ptView) return;
        svg.__ptView = true;

        const SIN60 = Math.sqrt(3) / 2, TAN30 = 1 / Math.sqrt(3);
        const MIN_SIDE = 5, DRAG_PX = 4, IDLE_MS = 150, THROTTLE_MS = 300;

        // ---------- Aralık matematiği (TernaryRange ile aynı) ----------
        function parse() {
            const r = (svg.getAttribute('data-range') || '0 0 0').split(' ').map(Number);
            return r.length === 3 && r.every(isFinite) ? r : [0, 0, 0];
        }
        function sideOf(r) { return 100 - r[0] - r[1] - r[2]; }
        function same(a, b) { return Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9 && Math.abs(a[2] - b[2]) < 1e-9; }

        // v'ye en yakın nokta: m ≥ 0, Σm = total (sıralamaya dayalı izdüşüm)
        function project(v, total) {
            if (total <= 0) return [0, 0, 0];
            const u = v.slice().sort(function (a, b) { return b - a; });
            let cum = 0, theta = 0;
            for (let i = 0; i < u.length; i++) {
                cum += u[i];
                const t = (cum - total) / (i + 1);
                if (u[i] - t > 0) theta = t;
            }
            return v.map(function (x) { return Math.max(0, x - theta); });
        }

        // Kutularda düzgün görünsün: 0,1'e yuvarla; kenar en küçük değerin altına inerse aşağı yuvarla
        function tidy(r) {
            let t = r.map(function (x) { return Math.max(0, Math.round(x * 10) / 10); });
            if (sideOf(t) < MIN_SIDE) t = r.map(function (x) { return Math.max(0, Math.floor(x * 10 + 1e-6) / 10); });
            return t;
        }

        // SVG noktası → çerçevedeki bileşim (0–1, her durumda dönüşümsüz çerçeveye göre)
        function frameComp(p) {
            const X = (p.x - opts.left) / opts.side, Y = (opts.bottom - p.y) / opts.side;
            return [Y / SIN60, X - Y * TAN30, 1 - X - Y * TAN30];
        }
        function toSvg(cx, cy) {
            const m = svg.getScreenCTM();
            if (!m) return null;
            const pt = svg.createSVGPoint();
            pt.x = cx; pt.y = cy;
            return pt.matrixTransform(m.inverse());
        }

        // ---------- Durum ----------
        let rendered = parse();
        let raw = rendered.slice();     // hareket sırasında yuvarlanmamış hedef (küçük adımlar kaybolmasın)
        let target = rendered.slice();
        let inflight = false, pending = false, idleTimer = 0, lastSend = 0;

        // rendered → target önizleme dönüşümü. Su köşesi V = ((s + o/2)/100, o/100·sin60), kenar l;
        // x' = k·x + tx, y' = k·y + ty, k = l0 / l.
        function applyPreview() {
            const l0 = sideOf(rendered) / 100, l = sideOf(target) / 100;
            const v0x = (rendered[1] + rendered[0] / 2) / 100, v0y = rendered[0] / 100 * SIN60;
            const vx = (target[1] + target[0] / 2) / 100, vy = target[0] / 100 * SIN60;
            const k = l0 / l;
            const tx = opts.left * (1 - k) + opts.side * (v0x - vx) / l;
            const ty = opts.bottom * (1 - k) - opts.side * (v0y - vy) / l;
            const tf = same(rendered, target) ? null : 'translate(' + tx + ' ' + ty + ') scale(' + k + ')';
            svg.querySelectorAll('.ternary-pan').forEach(function (g) {
                if (tf) g.setAttribute('transform', tf); else g.removeAttribute('transform');
            });
        }

        function setTarget(r) {
            raw = r;
            target = tidy(r);
            applyPreview();
            schedule();
        }

        function send() {
            clearTimeout(idleTimer); idleTimer = 0;
            if (inflight) { pending = true; return; }
            if (same(target, rendered)) return;
            inflight = true;
            lastSend = Date.now();
            dotnet.invokeMethodAsync('SetRangeFromView', target[0], target[1], target[2])
                .catch(function () { /* bağlantı koptuysa sonraki hareket yeniden dener */ })
                .finally(function () {
                    inflight = false;
                    if (pending) { pending = false; send(); }
                });
        }
        function schedule() {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(send, IDLE_MS);
            if (!inflight && Date.now() - lastSend > THROTTLE_MS) send();
        }

        // Blazor yeni aralıkla çizdi. Hareket yokken gelen değişiklik dışarıdandır (kutular,
        // düğmeler, dosya): hedef de ona geçer. Hareket sürerken önizleme hedefe göre kalır.
        new MutationObserver(function () {
            rendered = parse();
            if (!idleTimer && !inflight && !drag) { raw = rendered.slice(); target = rendered.slice(); }
            applyPreview();
        }).observe(svg, { attributes: true, attributeFilter: ['data-range'] });

        // ---------- Gösterge ----------
        const box = wrap.querySelector('.zoom-readout');
        const outOil = box && box.querySelector('[data-ro="oil"]');
        const outSurf = box && box.querySelector('[data-ro="surf"]');
        const outWater = box && box.querySelector('[data-ro="water"]');
        const lang = document.documentElement.lang || undefined;
        const fmt1 = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        const fmt2 = new Intl.NumberFormat(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        function updateReadout(e) {
            if (!box) return;
            const p = toSvg(e.clientX, e.clientY);
            if (!p) return;
            const f = frameComp(p);
            if (f[0] < 0 || f[1] < 0 || f[2] < 0) { box.classList.remove('show'); return; }
            const side = sideOf(target);
            const nf = side < 25 ? fmt2 : fmt1;
            outOil.textContent = nf.format(target[0] + side * f[0]);
            outSurf.textContent = nf.format(target[1] + side * f[1]);
            outWater.textContent = nf.format(target[2] + side * f[2]);
            box.classList.add('show');
        }
        svg.addEventListener('pointerleave', function () { if (box) box.classList.remove('show'); });

        // ---------- Tekerlek ----------
        const hint = wrap.querySelector('.zoom-hint');
        if (hint) hint.textContent = opts.hint || '';
        let hintTimer = 0;
        function showHint() {
            if (!hint) return;
            hint.classList.add('show');
            clearTimeout(hintTimer);
            hintTimer = setTimeout(function () { hint.classList.remove('show'); }, 1400);
        }

        // İmlecin altındaki bileşim yerinde kalacak biçimde kenarı factor'a böl
        function zoomAt(cx, cy, factor) {
            const p = toSvg(cx, cy);
            if (!p) return;
            const f = frameComp(p);
            const side = sideOf(raw);
            const ns = Math.min(100, Math.max(MIN_SIDE, side / factor));
            if (Math.abs(ns - side) < 1e-9) return;
            const want = [0, 1, 2].map(function (i) { return raw[i] + side * f[i] - ns * f[i]; });
            setTarget(project(want, 100 - ns));
        }

        svg.addEventListener('wheel', function (e) {
            if (!(e.ctrlKey || e.metaKey)) { showHint(); return; }
            e.preventDefault();
            // Tekerlek çentiği ~100 piksel (×1,5), kıstırma küçük deltalar üretir
            const unit = e.deltaMode === 1 ? 33 : (e.deltaMode === 2 ? 400 : 1);
            const d = Math.min(200, Math.max(-200, e.deltaY * unit));
            zoomAt(e.clientX, e.clientY, Math.exp(-d * 0.004));
            updateReadout(e);
        }, { passive: false });

        // ---------- Sürükleme ----------
        // Yalnız yakınlaştırılmışken. Yakalama sürükleme başlayınca alınır: yoksa tıklamanın hedefi
        // SVG olur ve gruba tıklayarak seçme çalışmaz.
        let drag = null, suppressClick = false;

        function panBy(dxPx, dyPx) {
            const m = svg.getScreenCTM();
            if (!m || !m.a) return;
            // Ekran → çerçeve (kenar = 1), y yukarı
            const fx = dxPx / m.a / opts.side, fy = -dyPx / m.d / opts.side;
            const side = sideOf(raw);
            // İçerik imleçle gider: görünen bölgenin alt sınırları vektörün bileşimi kadar geri kayar
            const d = [fy / SIN60, fx - fy * TAN30, -fx - fy * TAN30];
            const want = [0, 1, 2].map(function (i) { return raw[i] - side * d[i]; });
            setTarget(project(want, 100 - side));
        }

        svg.addEventListener('pointerdown', function (e) {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            suppressClick = false;
            if (drag || sideOf(target) >= 100 - 1e-9) return;
            drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
        });

        svg.addEventListener('pointermove', function (e) {
            if (e.pointerType !== 'touch') updateReadout(e);
            if (!drag || drag.id !== e.pointerId) return;
            const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
            if (!drag.moved) {
                if (Math.hypot(dx, dy) < DRAG_PX) return;
                drag.moved = true;
                try { svg.setPointerCapture(e.pointerId); } catch (_) { /* yoksay */ }
                svg.classList.add('is-panning');
            }
            panBy(dx, dy);
            drag.x = e.clientX; drag.y = e.clientY;
            e.preventDefault();
        });

        function endDrag(e) {
            if (!drag || drag.id !== e.pointerId) return;
            if (drag.moved) { suppressClick = true; send(); }
            drag = null;
            svg.classList.remove('is-panning');
        }
        svg.addEventListener('pointerup', endDrag);
        svg.addEventListener('pointercancel', endDrag);
        svg.addEventListener('pointerleave', function (e) {
            if (!svg.hasPointerCapture(e.pointerId)) endDrag(e);
        });

        // Sürükleme sonundaki tıklama seçimi değiştirmesin. Yakalama aşamasında durdurulan olay
        // Blazor'un document üzerindeki dinleyicisine ulaşmaz.
        svg.addEventListener('click', function (e) {
            if (!suppressClick) return;
            suppressClick = false;
            e.stopPropagation();
            e.preventDefault();
        }, true);
    }
};
