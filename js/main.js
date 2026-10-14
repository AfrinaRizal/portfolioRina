(function ($) {
    "use strict";

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;


    // Navbar state, scroll progress bar, back-to-top, timeline fill
    var $nav = $('.site-nav');
    var $top = $('.back-to-top');
    var progress = document.querySelector('.scroll-progress');
    var timeline = document.querySelector('.timeline');
    var timelineFill = document.querySelector('.timeline-fill');
    var ticking = false;

    function onScroll() {
        var y = window.scrollY;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        $nav.toggleClass('scrolled', y > 8);
        $top.toggleClass('show', y > 600);
        if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';

        if (timeline && timelineFill) {
            var r = timeline.getBoundingClientRect();
            var seen = window.innerHeight * 0.6 - r.top;
            var h = Math.max(0, Math.min(r.height - 16, seen));
            timelineFill.style.height = h + 'px';
        }
        ticking = false;
    }
    $(window).on('scroll resize', function () {
        if (!ticking) {
            window.requestAnimationFrame(onScroll);
            ticking = true;
        }
    });
    onScroll();


    // Collapse the mobile menu after choosing a section
    $('.site-nav .nav-link').on('click', function () {
        if ($('#navbarCollapse').hasClass('show')) {
            $('.site-nav .navbar-toggler').trigger('click');
        }
    });


    // Highlight the nav link of the section currently in view
    var $links = $('.site-nav .nav-link[href^="#"]');
    if ('IntersectionObserver' in window) {
        var navObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    $links.removeClass('active');
                    $links.filter('[href="#' + entry.target.id + '"]').addClass('active');
                }
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        $links.each(function () {
            var target = document.querySelector(this.getAttribute('href'));
            if (target) navObserver.observe(target);
        });
    }


    // Reveal elements as they scroll into view
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !reduceMotion) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px' });
        reveals.forEach(function (el) { revealObserver.observe(el); });
    } else {
        reveals.forEach(function (el) { el.classList.add('in'); });
    }


    // Count-up numbers in the hero stats
    function countUp(el) {
        var target = parseFloat(el.getAttribute('data-count'));
        var decimals = (el.getAttribute('data-count').split('.')[1] || '').length;
        if (reduceMotion) {
            el.textContent = target.toFixed(decimals);
            return;
        }
        var start = null;
        var duration = 1400;
        function step(ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = (target * eased).toFixed(decimals);
            if (p < 1) window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
    }
    var counters = document.querySelectorAll('[data-count]');
    if ('IntersectionObserver' in window) {
        var countObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    countUp(entry.target);
                    countObserver.unobserve(entry.target);
                }
            });
        });
        counters.forEach(function (el) { countObserver.observe(el); });
    }


    // Typed role line in the hero
    if ($('.typed-text-output').length && window.Typed) {
        var strings = $('.typed-text').text().trim().split(', ');
        if (reduceMotion) {
            $('.typed-text-output').text(strings[0]);
        } else {
            new Typed('.typed-text-output', {
                strings: strings,
                typeSpeed: 55,
                backSpeed: 25,
                backDelay: 1800,
                loop: true
            });
        }
    }


    // Subtle tilt on the hero code card
    var editor = document.querySelector('.editor');
    if (editor && finePointer && !reduceMotion) {
        var wrap = editor.parentElement;
        wrap.addEventListener('mousemove', function (e) {
            var r = wrap.getBoundingClientRect();
            var x = (e.clientX - r.left) / r.width - 0.5;
            var y = (e.clientY - r.top) / r.height - 0.5;
            editor.style.setProperty('--ry', (x * 6).toFixed(2) + 'deg');
            editor.style.setProperty('--rx', (-y * 6).toFixed(2) + 'deg');
        });
        wrap.addEventListener('mouseleave', function () {
            editor.style.setProperty('--ry', '0deg');
            editor.style.setProperty('--rx', '0deg');
        });
    }


    // Cursor-follow glow on cards
    if (finePointer) {
        $(document).on('mousemove', '.spot', function (e) {
            var r = this.getBoundingClientRect();
            this.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            this.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
    }


    // Project filter with sliding pill
    var $filters = $('.filters');
    var $pill = $filters.find('.pill');
    function movePill() {
        var $active = $filters.find('button.active');
        if (!$active.length) return;
        var b = $active[0];
        $pill.css({
            width: b.offsetWidth + 'px',
            height: b.offsetHeight + 'px',
            transform: 'translate(' + b.offsetLeft + 'px, ' + (b.offsetTop - 4) + 'px)'
        });
    }
    $filters.find('button').each(function () {
        var f = $(this).data('filter');
        var n = f === '*' ? $('.project-item').length : $('.project-item.' + f).length;
        $(this).append('<span class="count">' + n + '</span>');
    });
    movePill();
    $(window).on('resize load', movePill);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);

    $filters.find('button').on('click', function () {
        var filter = $(this).data('filter');
        $filters.find('button').removeClass('active').attr('aria-pressed', 'false');
        $(this).addClass('active').attr('aria-pressed', 'true');
        movePill();

        var $items = $('.project-item');
        $items.addClass('is-fading');
        setTimeout(function () {
            $items.each(function () {
                var show = filter === '*' || $(this).hasClass(filter);
                $(this).toggleClass('is-hidden', !show);
            });
            // let the browser lay out the visible cards before fading them in
            window.requestAnimationFrame(function () {
                $items.removeClass('is-fading');
            });
        }, reduceMotion ? 0 : 220);
    });


    // Show / hide the full list of responsibilities
    $('.more-toggle').on('click', function () {
        var $wrap = $($(this).data('target'));
        var expanded = $(this).attr('aria-expanded') === 'true';
        $wrap.toggleClass('open', !expanded);
        $wrap.find('ul').attr('aria-hidden', String(expanded));
        $(this).attr('aria-expanded', String(!expanded));
        $(this).find('.label').text(expanded ? $(this).data('more') : $(this).data('less'));
    });


    // Copy email to clipboard
    $('.copy-email').on('click', function (e) {
        var $btn = $(this);
        var email = $btn.data('email');
        if (!navigator.clipboard) return; // falls through to the mailto: link
        e.preventDefault();
        navigator.clipboard.writeText(email).then(function () {
            $btn.addClass('copied').find('.hint').text('copied ✓');
            setTimeout(function () {
                $btn.removeClass('copied').find('.hint').text('click to copy');
            }, 2000);
        }, function () {
            window.location.href = 'mailto:' + email;
        });
    });

})(jQuery);
