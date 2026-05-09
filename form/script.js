/* ═══════════════════════════════════════════
   FO RM — Interactive Section Controller
   Drag, scroll, and cycle through sections
   independently with inertia physics.
   ═══════════════════════════════════════════ */

(function () {
    'use strict';

    const FRICTION = 0.92;
    const VELOCITY_THRESHOLD = 0.5;
    const SNAP_THRESHOLD = 0.2;
    const DRAG_MULTIPLIER = 1.8;

    const sections = document.querySelectorAll('.section');
    const pageIndicator = document.getElementById('pageIndicator');

    const state = new Map();

    sections.forEach(section => {
        const track = section.querySelector('.section-track');
        const slides = track.querySelectorAll('.slide');
        const sectionId = section.dataset.section;

        state.set(sectionId, {
            el: section,
            track: track,
            slides: slides,
            totalSlides: slides.length,
            currentIndex: 0,
            offset: 0,
            targetOffset: 0,
            velocity: 0,
            isDragging: false,
            startX: 0,
            startOffset: 0,
            lastX: 0,
            lastTime: 0,
            animFrame: null
        });
    });

    function getSlideWidth(sectionState) {
        return sectionState.el.offsetWidth;
    }

    function setTrackPosition(sectionState, offset) {
        sectionState.offset = offset;
        sectionState.track.style.transform = `translateX(${offset}px)`;
    }

    function snapToNearest(sectionState) {
        const slideWidth = getSlideWidth(sectionState);
        let index = Math.round(-sectionState.offset / slideWidth);
        index = Math.max(0, Math.min(index, sectionState.totalSlides - 1));
        sectionState.currentIndex = index;
        sectionState.targetOffset = -index * slideWidth;
        animateSnap(sectionState);
        updateIndicator();
    }

    function animateSnap(sectionState) {
        if (sectionState.animFrame) {
            cancelAnimationFrame(sectionState.animFrame);
        }

        function step() {
            const diff = sectionState.targetOffset - sectionState.offset;
            if (Math.abs(diff) < 0.5) {
                setTrackPosition(sectionState, sectionState.targetOffset);
                sectionState.animFrame = null;
                return;
            }
            const newOffset = sectionState.offset + diff * 0.12;
            setTrackPosition(sectionState, newOffset);
            sectionState.animFrame = requestAnimationFrame(step);
        }

        sectionState.animFrame = requestAnimationFrame(step);
    }

    function animateInertia(sectionState) {
        if (sectionState.animFrame) {
            cancelAnimationFrame(sectionState.animFrame);
        }

        function step() {
            if (Math.abs(sectionState.velocity) < VELOCITY_THRESHOLD) {
                snapToNearest(sectionState);
                return;
            }

            sectionState.velocity *= FRICTION;
            const newOffset = sectionState.offset + sectionState.velocity;

            const slideWidth = getSlideWidth(sectionState);
            const minOffset = -(sectionState.totalSlides - 1) * slideWidth;
            const maxOffset = 0;

            if (newOffset > maxOffset) {
                sectionState.velocity *= 0.5;
                setTrackPosition(sectionState, maxOffset + (newOffset - maxOffset) * 0.3);
            } else if (newOffset < minOffset) {
                sectionState.velocity *= 0.5;
                setTrackPosition(sectionState, minOffset + (newOffset - minOffset) * 0.3);
            } else {
                setTrackPosition(sectionState, newOffset);
            }

            const velocityInSlides = Math.abs(sectionState.velocity) / slideWidth;
            if (velocityInSlides < SNAP_THRESHOLD) {
                snapToNearest(sectionState);
                return;
            }

            sectionState.animFrame = requestAnimationFrame(step);
        }

        sectionState.animFrame = requestAnimationFrame(step);
    }

    function onPointerDown(e, sectionState) {
        if (sectionState.animFrame) {
            cancelAnimationFrame(sectionState.animFrame);
            sectionState.animFrame = null;
        }

        sectionState.isDragging = true;
        sectionState.startX = e.clientX;
        sectionState.startOffset = sectionState.offset;
        sectionState.lastX = e.clientX;
        sectionState.lastTime = Date.now();
        sectionState.velocity = 0;

        sectionState.el.classList.add('is-dragging');
        sectionState.track.classList.add('dragging');

        e.preventDefault();
    }

    function onPointerMove(e, sectionState) {
        if (!sectionState.isDragging) return;

        const now = Date.now();
        const dt = now - sectionState.lastTime;
        const dx = e.clientX - sectionState.lastX;

        if (dt > 0) {
            sectionState.velocity = (dx / dt) * 16 * DRAG_MULTIPLIER;
        }

        sectionState.lastX = e.clientX;
        sectionState.lastTime = now;

        const totalDx = (e.clientX - sectionState.startX) * DRAG_MULTIPLIER;
        let newOffset = sectionState.startOffset + totalDx;

        const slideWidth = getSlideWidth(sectionState);
        const minOffset = -(sectionState.totalSlides - 1) * slideWidth;
        const maxOffset = 0;

        if (newOffset > maxOffset) {
            newOffset = maxOffset + (newOffset - maxOffset) * 0.25;
        } else if (newOffset < minOffset) {
            newOffset = minOffset + (newOffset - minOffset) * 0.25;
        }

        setTrackPosition(sectionState, newOffset);
    }

    function onPointerUp(sectionState) {
        if (!sectionState.isDragging) return;
        sectionState.isDragging = false;

        sectionState.el.classList.remove('is-dragging');
        sectionState.track.classList.remove('dragging');

        if (Math.abs(sectionState.velocity) > 2) {
            animateInertia(sectionState);
        } else {
            snapToNearest(sectionState);
        }
    }

    sections.forEach(section => {
        const sectionId = section.dataset.section;
        const sectionState = state.get(sectionId);

        section.addEventListener('pointerdown', (e) => {
            section.setPointerCapture(e.pointerId);
            onPointerDown(e, sectionState);
        });

        section.addEventListener('pointermove', (e) => {
            onPointerMove(e, sectionState);
        });

        section.addEventListener('pointerup', (e) => {
            section.releasePointerCapture(e.pointerId);
            onPointerUp(sectionState);
        });

        section.addEventListener('pointercancel', () => {
            onPointerUp(sectionState);
        });

        section.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaX || e.deltaY;
            const direction = delta > 0 ? 1 : -1;
            const newIndex = Math.max(0, Math.min(
                sectionState.currentIndex + direction,
                sectionState.totalSlides - 1
            ));

            if (newIndex !== sectionState.currentIndex) {
                sectionState.currentIndex = newIndex;
                const slideWidth = getSlideWidth(sectionState);
                sectionState.targetOffset = -newIndex * slideWidth;
                sectionState.track.classList.remove('dragging');
                animateSnap(sectionState);
                updateIndicator();
            }
        }, { passive: false });
    });

    function updateIndicator() {
        const indicators = [];
        state.forEach((s, id) => {
            const pageName = id.replace('-', ' ');
            indicators.push(`${pageName}: ${s.currentIndex + 1}/${s.totalSlides}`);
        });
        if (pageIndicator) {
            const leftTop = state.get('left-top');
            const rightTop = state.get('right-top');
            if (leftTop && rightTop) {
                pageIndicator.textContent = `L${leftTop.currentIndex + 1} · R${rightTop.currentIndex + 1}`;
            }
        }
    }

    function handleResize() {
        state.forEach((sectionState) => {
            const slideWidth = getSlideWidth(sectionState);
            sectionState.offset = -sectionState.currentIndex * slideWidth;
            sectionState.targetOffset = sectionState.offset;
            setTrackPosition(sectionState, sectionState.offset);
        });
    }

    window.addEventListener('resize', handleResize);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const direction = e.key === 'ArrowRight' ? 1 : -1;
            state.forEach((sectionState) => {
                const newIndex = Math.max(0, Math.min(
                    sectionState.currentIndex + direction,
                    sectionState.totalSlides - 1
                ));
                if (newIndex !== sectionState.currentIndex) {
                    sectionState.currentIndex = newIndex;
                    const slideWidth = getSlideWidth(sectionState);
                    sectionState.targetOffset = -newIndex * slideWidth;
                    sectionState.track.classList.remove('dragging');
                    animateSnap(sectionState);
                }
            });
            updateIndicator();
        }
    });

    // Touch support enhancements
    document.addEventListener('touchmove', (e) => {
        let anyDragging = false;
        state.forEach((s) => {
            if (s.isDragging) anyDragging = true;
        });
        if (anyDragging) {
            e.preventDefault();
        }
    }, { passive: false });

    // Initial indicator
    updateIndicator();

    // Entrance animation
    document.addEventListener('DOMContentLoaded', () => {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 1.2s ease';
        requestAnimationFrame(() => {
            document.body.style.opacity = '1';
        });
    });

    // Ambient hover lighting
    const notebook = document.querySelector('.notebook');
    if (notebook) {
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;
            notebook.style.transform = `rotateX(${1.5 - y * 0.5}deg) rotateY(${-0.5 + x * 0.8}deg)`;
        });
    }

})();
