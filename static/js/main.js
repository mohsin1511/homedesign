const site = {
    currentTestimonial: 0,
    testimonialTimer: null,
    testimonialPaused: false,
    scrollTicking: false
};

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function easeOutCubic(progress) {
    return 1 - Math.pow(1 - progress, 3);
}

function getPointerX(event) {
    return event.touches ? event.touches[0].clientX : event.clientX;
}

function isTouchDevice() {
    return window.matchMedia("(pointer: coarse)").matches;
}

function isSmallScreen() {
    return window.matchMedia("(max-width: 900px)").matches;
}

function setupNavigation() {
    const navbar = $("#navbar");
    const hamburger = $("#hamburger");
    const navLinks = $("#navLinks");
    const sidebarOverlay = $("#sidebarOverlay");
    const sidebarClose = $("#sidebarClose");
    const backToTopButton = $("#backToTop");

    if (!navbar || !hamburger || !navLinks || !sidebarOverlay || !sidebarClose || !backToTopButton) {
        return;
    }

    function setMenu(open) {
        navLinks.classList.toggle("active", open);
        sidebarOverlay.classList.toggle("active", open);
        hamburger.classList.toggle("active", open);
        hamburger.setAttribute("aria-expanded", String(open));
        document.body.classList.toggle("sidebar-open", open);
    }

    function updateChrome() {
        navbar.classList.toggle("scrolled", window.scrollY > 50);
        backToTopButton.classList.toggle("visible", window.scrollY > 400);
        site.scrollTicking = false;
    }

    function requestChromeUpdate() {
        if (site.scrollTicking) return;
        site.scrollTicking = true;
        requestAnimationFrame(updateChrome);
    }

    hamburger.addEventListener("click", () => {
        setMenu(!navLinks.classList.contains("active"));
    });

    sidebarOverlay.addEventListener("click", () => setMenu(false));
    sidebarClose.addEventListener("click", () => setMenu(false));

    $$(".nav-links-list a").forEach((link) => {
        link.addEventListener("click", () => {
            setMenu(false);
            $$(".nav-links-list a").forEach((item) => item.classList.remove("active"));
            link.classList.add("active");
        });
    });

    backToTopButton.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", requestChromeUpdate, { passive: true });
    updateChrome();
}

function setupRevealAnimations() {
    const elements = $$(
        ".animate-on-scroll, .animate-stagger, .animate-scale, .animate-slide-left, .animate-slide-right"
    );

    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.16,
        rootMargin: "0px 0px -70px 0px"
    });

    elements.forEach((element) => observer.observe(element));
}

function setupBeforeAfterSlider() {
    const container = $("#beforeAfterSlider");
    if (!container) return;

    const wrapper = $(".before-after-wrapper", container);
    const afterImage = $("#afterImage");
    const handle = $("#sliderHandle");
    let isDragging = false;
    let pendingX = null;
    let animationFrame = null;

    if (!wrapper || !afterImage || !handle) return;

    // Disable interactive slider on small screens — show static after image
    if (isSmallScreen()) {
        afterImage.style.clipPath = `inset(0 0 0 0)`;
        if (handle) handle.style.display = "none";
        wrapper.classList.remove("is-dragging");
        return;
    }

    function paintSlider(clientX) {
        const rect = wrapper.getBoundingClientRect();
        const position = clamp((clientX - rect.left) / rect.width, 0, 1);
        const percent = position * 100;

        afterImage.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
        handle.style.left = `${percent}%`;
        animationFrame = null;
    }

    function scheduleSliderPaint(clientX) {
        pendingX = clientX;
        if (animationFrame) return;
        animationFrame = requestAnimationFrame(() => paintSlider(pendingX));
    }

    function startDrag(event) {
        isDragging = true;
        handle.classList.add("dragging");
        wrapper.classList.add("is-dragging");
        scheduleSliderPaint(getPointerX(event));
    }

    function moveDrag(event) {
        if (!isDragging) return;
        event.preventDefault();
        scheduleSliderPaint(getPointerX(event));
    }

    function endDrag() {
        isDragging = false;
        handle.classList.remove("dragging");
        wrapper.classList.remove("is-dragging");
    }

    handle.addEventListener("mousedown", startDrag);
    handle.addEventListener("touchstart", startDrag, { passive: true });
    wrapper.addEventListener("click", (event) => {
        if (isTouchDevice()) return;
        scheduleSliderPaint(event.clientX);
    });
    window.addEventListener("mousemove", moveDrag);
    window.addEventListener("touchmove", moveDrag, { passive: false });
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchend", endDrag);
}

function setupCounters() {
    const counters = $$(".stat-card .number");
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const counter = entry.target;
            const target = Number(counter.dataset.target || 0);
            const duration = 1800;
            const startTime = performance.now();

            function tick(now) {
                const progress = clamp((now - startTime) / duration, 0, 1);
                const easedProgress = easeOutCubic(progress);
                counter.textContent = `${Math.round(target * easedProgress)}+`;

                if (progress < 1) {
                    requestAnimationFrame(tick);
                }
            }

            requestAnimationFrame(tick);
            observer.unobserve(counter);
        });
    }, { threshold: 0.45 });

    counters.forEach((counter) => observer.observe(counter));
}

function setupTimeline() {
    const timeline = $("#timeline");
    const fill = $("#timelineFill");
    if (!timeline || !fill) return;

    const steps = $$(".timeline-step", timeline);
    let ticking = false;

    function updateTimeline() {
        const rect = timeline.getBoundingClientRect();
        const progress = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0, 1);
        const activeCount = Math.ceil(progress * steps.length);

        fill.style.width = `${progress * 100}%`;
        steps.forEach((step, index) => {
            step.classList.toggle("active", index < activeCount);
        });

        ticking = false;
    }

    function requestTimelineUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(updateTimeline);
    }

    window.addEventListener("scroll", requestTimelineUpdate, { passive: true });
    window.addEventListener("resize", requestTimelineUpdate);
    updateTimeline();
}

function setupTestimonials() {
    const track = $("#testimonialTrack");
    const slider = $("#testimonialSlider");
    const nextButton = $("#nextTestimonial");
    const prevButton = $("#prevTestimonial");
    const dots = $$(".testimonial-dot");
    const cards = track ? $$(".testimonial-card", track) : [];

    if (!track || !slider || !nextButton || !prevButton || !cards.length) return;

    // On small screens, disable interactive carousel and show static testimonials
    if (isSmallScreen()) {
        clearInterval(site.testimonialTimer);
        // show all cards stacked vertically
        track.style.transform = "translateX(0)";
        track.style.display = "block";
        track.style.flexWrap = "wrap";
        cards.forEach((card) => card.classList.add("active"));
        // hide controls and dots
        nextButton.style.display = "none";
        prevButton.style.display = "none";
        $$(".testimonial-dot").forEach((d) => (d.style.display = "none"));
        return;
    }

    function showTestimonial(index) {
        site.currentTestimonial = (index + cards.length) % cards.length;
        track.style.transform = `translateX(-${site.currentTestimonial * 100}%)`;

        cards.forEach((card, cardIndex) => {
            card.classList.toggle("active", cardIndex === site.currentTestimonial);
        });

        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle("active", dotIndex === site.currentTestimonial);
        });
    }

    function startRotation() {
        clearInterval(site.testimonialTimer);
        site.testimonialTimer = setInterval(() => {
            if (!site.testimonialPaused) {
                showTestimonial(site.currentTestimonial + 1);
            }
        }, 5400);
    }

    nextButton.addEventListener("click", () => {
        showTestimonial(site.currentTestimonial + 1);
        startRotation();
    });

    prevButton.addEventListener("click", () => {
        showTestimonial(site.currentTestimonial - 1);
        startRotation();
    });

    dots.forEach((dot) => {
        dot.addEventListener("click", () => {
            showTestimonial(Number(dot.dataset.index));
            startRotation();
        });
    });

    slider.addEventListener("mouseenter", () => {
        site.testimonialPaused = true;
    });

    slider.addEventListener("mouseleave", () => {
        site.testimonialPaused = false;
    });

    let touchStartX = 0;

    track.addEventListener("touchstart", (event) => {
        touchStartX = event.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener("touchend", (event) => {
        const swipeDistance = touchStartX - event.changedTouches[0].screenX;
        if (Math.abs(swipeDistance) < 50) return;

        showTestimonial(site.currentTestimonial + (swipeDistance > 0 ? 1 : -1));
        startRotation();
    }, { passive: true });

    showTestimonial(0);
    startRotation();
}

document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    setupRevealAnimations();
    setupBeforeAfterSlider();
    setupCounters();
    setupTimeline();
    setupTestimonials();
});
