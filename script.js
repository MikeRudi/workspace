// LENIS SETUP
const lenis = new Lenis({
  duration: 0.5,
  easing: (t) => 1 - Math.pow(1 - t, 3), // ease-out cubic
  // easing: (t) => 1 - Math.pow(1 - t, 3),
  smoothWheel: true,
  smoothTouch: false,
});

// RAF LOOP
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// SYNC WITH SCROLLTRIGGER
lenis.on("scroll", ScrollTrigger.update);

function landerVideoExpand() {
  const $vid = $("[lander-vid-wrap]");

  const landerVideoExpandTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".lander-wrap",
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      //   markers: true,
    },
    defaults: { ease: "linear" },
  });

  landerVideoExpandTimeline.fromTo(
    $vid,
    { scale: 0 },
    { scale: 1, transformOrigin: "center center" }
  );
}

landerVideoExpand();

function bgEllipseScroll() {
  const CFG = {
    rxStart: "80vw",
    ryStart: "50vh",
    rxEnd: "1vw",
    ryEnd: "5vh",
    spin: 50,
    angleSpreadDeg: 50,
    xShiftEnd: "0vw",
    angleOffsetUpDeg: 10,
    angleOffsetDownDeg: -20,
    markers: false,
    ovalMidStart: 0.5, // ↓ start of slow middle phase
    ovalMidEnd: 0.85, // ↓ end of slow middle phase
  };

  const RANGES = {
    itemSpin: { start: 0.0, end: 1 },
    itemScaleDown: { start: 0.6, end: 1.0 },
    showcaseText: { start: 0.5, end: 0.8 },
    showcasePhone: { start: 0.66, end: 1.0 },
  };

  const EASES = {
    itemSpin: "power1.in",
    ovalFast: "power3.out",
    ovalSlow: "power1.in",
    itemScaleDown: "power3.in",
    showcaseText: "power3.in",
    showcasePhoneY: "power3.out",
    showcasePhoneScale: "power3.out",
  };

  const toPx = (val) => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      if (val.endsWith("vw"))
        return (window.innerWidth * parseFloat(val)) / 100;
      if (val.endsWith("vh"))
        return (window.innerHeight * parseFloat(val)) / 100;
      return parseFloat(val);
    }
    return 0;
  };
  const dur = (r) => Math.max(0, r.end - r.start);
  const lerp = (a, b, t) => a + (b - a) * t;

  const $wrap = $("[bg-animate-wrap]");
  const $trigger = $("[bg-animate-trigger]");
  const $items = $wrap.find("[bg-animate-item]");
  const $showText = $("[showcase-text]");
  const $showPhone = $("[showcase-phone]");
  if (!$wrap.length || !$items.length || !$trigger.length) return;

  gsap.set($wrap, { position: "relative" });
  gsap.set($items, {
    position: "absolute",
    top: "50%",
    left: "50%",
    xPercent: -50,
    yPercent: -50,
    transformOrigin: "50% 50%",
    rotation: 0,
  });
  gsap.set($showText, { transformOrigin: "50% 50%", clearProps: "scale,y" });
  gsap.set($showPhone, { yPercent: 200, scale: 2, transformOrigin: "50% 50%" });

  const state = {
    spin: 0,
    dy: 0,
    dx: 0,
    scale: 1,
    ovalT: 0,
  };

  // cache pixel radii (recomputed on resize)
  let rxStartPx = toPx(CFG.rxStart);
  let ryStartPx = toPx(CFG.ryStart);
  let rxEndPx = toPx(CFG.rxEnd);
  let ryEndPx = toPx(CFG.ryEnd);

  const spread = (CFG.angleSpreadDeg * Math.PI) / 180;
  const offsetUp = (CFG.angleOffsetUpDeg * Math.PI) / 180;
  const offsetDown = (CFG.angleOffsetDownDeg * Math.PI) / 180;
  const count = $items.length;
  const leftCount = Math.floor(count / 2);
  const rightCount = count - leftCount;

  function spreadAngles(n, a, b) {
    if (n <= 0) return [];
    if (n === 1) return [(a + b) / 2];
    const step = (b - a) / (n - 1);
    return Array.from({ length: n }, (_, i) => a + i * step);
  }

  const rightAngles = spreadAngles(
    rightCount,
    -spread - offsetUp,
    spread - offsetUp
  );
  const leftAngles = spreadAngles(
    leftCount,
    Math.PI - spread + offsetDown,
    Math.PI + spread + offsetDown
  );
  const baseAngles = rightAngles.concat(leftAngles);

  function layout() {
    const spinRad = (state.spin * Math.PI) / 180;
    const rx = lerp(rxStartPx, rxEndPx, state.ovalT);
    const ry = lerp(ryStartPx, ryEndPx, state.ovalT);

    for (let i = 0; i < $items.length; i++) {
      const t = baseAngles[i] + spinRad;
      const x = Math.cos(t) * rx + state.dx;
      const y = Math.sin(t) * ry + state.dy;
      gsap.set($items[i], { x, y, rotation: 0, scale: state.scale });
    }
  }

  function buildTimeline() {
    const bgEllipseScrollTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: $trigger.get(0),
        start: "top bottom",
        end: "bottom 50%",
        scrub: true,
        markers: CFG.markers,
      },
      onUpdate: layout,
    });

    bgEllipseScrollTimeline.add("itemSpin", RANGES.itemSpin.start);
    const total = dur(RANGES.itemSpin);

    // use config-based middle segment
    const startMid = CFG.ovalMidStart;
    const endMid = CFG.ovalMidEnd;

    const fast1Dur = total * startMid;
    const slowDur = total * (endMid - startMid);
    const fast2Dur = total * (1 - endMid);

    bgEllipseScrollTimeline.to(
      state,
      { ovalT: startMid, ease: EASES.ovalFast, duration: fast1Dur },
      "itemSpin"
    );
    bgEllipseScrollTimeline.to(state, {
      ovalT: endMid,
      ease: EASES.ovalSlow,
      duration: slowDur,
    });
    bgEllipseScrollTimeline.to(state, {
      ovalT: 1.0,
      ease: EASES.ovalFast,
      duration: fast2Dur,
    });

    bgEllipseScrollTimeline.to(
      state,
      { spin: CFG.spin, ease: EASES.itemSpin, duration: total },
      "itemSpin"
    );
    bgEllipseScrollTimeline.to(
      state,
      { dx: toPx(CFG.xShiftEnd), ease: EASES.itemSpin, duration: total },
      "itemSpin"
    );

    bgEllipseScrollTimeline.add("itemScaleDown", RANGES.itemScaleDown.start);
    bgEllipseScrollTimeline.to(
      state,
      {
        scale: 0,
        dy: -8,
        ease: EASES.itemScaleDown,
        duration: dur(RANGES.itemScaleDown),
      },
      "itemScaleDown"
    );

    if ($showText.length) {
      bgEllipseScrollTimeline.add("showcaseText", RANGES.showcaseText.start);
      bgEllipseScrollTimeline.to(
        $showText,
        {
          scale: 0,
          y: "-=8",
          ease: EASES.showcaseText,
          duration: dur(RANGES.showcaseText),
        },
        "showcaseText"
      );
    }

    if ($showPhone.length) {
      bgEllipseScrollTimeline.add("showcasePhone", RANGES.showcasePhone.start);
      const yDur = dur(RANGES.showcasePhone);
      const scaleDur = yDur * 0.9;
      const scaleDelay = yDur * 0.1;
      bgEllipseScrollTimeline.to(
        $showPhone,
        { yPercent: 0, ease: EASES.showcasePhoneY, duration: yDur },
        "showcasePhone"
      );
      bgEllipseScrollTimeline.to(
        $showPhone,
        { scale: 1, ease: EASES.showcasePhoneScale, duration: scaleDur },
        `showcasePhone+=${scaleDelay}`
      );
    }

    return bgEllipseScrollTimeline;
  }

  layout();
  let bgEllipseScrollTimeline = buildTimeline();

  function onResize() {
    const p = bgEllipseScrollTimeline.progress();
    rxStartPx = toPx(CFG.rxStart);
    ryStartPx = toPx(CFG.ryStart);
    rxEndPx = toPx(CFG.rxEnd);
    ryEndPx = toPx(CFG.ryEnd);
    state.dx = 0;
    gsap.set($showPhone, { yPercent: 200, scale: 2 });
    bgEllipseScrollTimeline.kill();
    bgEllipseScrollTimeline = buildTimeline();
    bgEllipseScrollTimeline.progress(p);
    layout();
    ScrollTrigger.refresh();
  }

  window.addEventListener("resize", onResize);
}

bgEllipseScroll();

// function bgEllipseScroll() {
//   const $wrap = $("[bg-animate-wrap]");
//   const $trigger = $("[bg-animate-trigger]");
//   const $items = $wrap.find("[bg-animate-item]");
//   if (!$wrap.length || !$items.length || !$trigger.length) return;

//   gsap.set($wrap, { position: "relative" });
//   gsap.set($items, {
//     position: "absolute",
//     top: "50%",
//     left: "50%",
//     xPercent: -50,
//     yPercent: -50,
//     transformOrigin: "50% 50%",
//     rotation: 0,
//   });

//   const wrapEl = $wrap.get(0);
//   const rect = () => wrapEl.getBoundingClientRect();

//   const rxStartAttr = parseFloat($wrap.attr("bg-radiusx-start"));
//   const ryStartAttr = parseFloat($wrap.attr("bg-radiusy-start"));
//   const rxEndAttr = parseFloat($wrap.attr("bg-radiusx-end"));
//   const ryEndAttr = parseFloat($wrap.attr("bg-radiusy-end"));
//   const spinAttr = parseFloat($wrap.attr("bg-spin-deg"));
//   const markers = $wrap.attr("bg-markers") === "true";

//   const defaults = () => {
//     const r = rect();
//     return {
//       rxStart: isNaN(rxStartAttr) ? 0.5 : rxStartAttr,
//       ryStart: isNaN(ryStartAttr) ? 0.5 : ryStartAttr,
//       rxEnd: isNaN(rxEndAttr) ? r.width * 0.35 : rxEndAttr,
//       ryEnd: isNaN(ryEndAttr) ? r.height * 0.35 : ryEndAttr,
//       spin: isNaN(spinAttr) ? 360 : spinAttr,
//     };
//   };

//   let cfg = defaults();

//   const state = { rx: cfg.rxStart, ry: cfg.ryStart, spin: 0 };

//   const baseAngles = $items
//     .map(function (i, el) {
//       const a = parseFloat($(el).attr("bg-angle"));
//       return isNaN(a) ? (i / $items.length) * Math.PI * 2 : (a * Math.PI) / 180;
//     })
//     .get();

//   function layout() {
//     const spinRad = (state.spin * Math.PI) / 180;
//     for (let i = 0; i < $items.length; i++) {
//       const t = baseAngles[i] + spinRad;
//       const x = Math.cos(t) * state.rx;
//       const y = Math.sin(t) * state.ry;
//       gsap.set($items[i], { x, y, rotation: 0 });
//     }
//   }

//   layout();

//   const bgEllipseScrollTimeline = gsap.timeline({
//     scrollTrigger: {
//       trigger: $trigger.get(0),
//       start: "top 80%",
//       end: "bottom bottom",
//       scrub: true,
//       markers,
//     },
//     onUpdate: layout,
//   });

//   bgEllipseScrollTimeline.to(state, { rx: cfg.rxEnd, ease: "none" }, 0);
//   bgEllipseScrollTimeline.to(state, { ry: cfg.ryEnd, ease: "none" }, 0);
//   bgEllipseScrollTimeline.to(state, { spin: cfg.spin, ease: "none" }, 0);

//   function onResize() {
//     const was = {
//       rx: state.rx,
//       ry: state.ry,
//       spin: state.spin,
//       p: bgEllipseScrollTimeline.progress(),
//     };
//     cfg = defaults();
//     bgEllipseScrollTimeline.clear();
//     state.rx = Math.min(was.rx, cfg.rxEnd);
//     state.ry = Math.min(was.ry, cfg.ryEnd);
//     state.spin = was.spin;
//     bgEllipseScrollTimeline
//       .to(state, { rx: cfg.rxEnd, ease: "none" }, 0)
//       .to(state, { ry: cfg.ryEnd, ease: "none" }, 0)
//       .to(state, { spin: cfg.spin, ease: "none" }, 0)
//       .progress(was.p);
//     layout();
//     ScrollTrigger.refresh();
//   }

//   window.addEventListener("resize", onResize);
// }

// bgEllipseScroll();

function gradientBg() {
  var colors = new Array(
    [252, 248, 240], //brand medium
    [246, 235, 209], //brand dark

    [255, 255, 253], //brand light
    [252, 248, 240], //brand medium

    [190, 217, 244], //blue
    [255, 255, 253] //brand light
  );

  var step = 0;

  var colorIndices = [0, 1, 2, 3];

  var gradientSpeed = 0.008;

  function updateGradient() {
    if ($ === undefined) return;

    var c0_0 = colors[colorIndices[0]];
    var c0_1 = colors[colorIndices[1]];
    var c1_0 = colors[colorIndices[2]];
    var c1_1 = colors[colorIndices[3]];

    var istep = 1 - step;
    var r1 = Math.round(istep * c0_0[0] + step * c0_1[0]);
    var g1 = Math.round(istep * c0_0[1] + step * c0_1[1]);
    var b1 = Math.round(istep * c0_0[2] + step * c0_1[2]);
    var color1 = "rgb(" + r1 + "," + g1 + "," + b1 + ")";

    var r2 = Math.round(istep * c1_0[0] + step * c1_1[0]);
    var g2 = Math.round(istep * c1_0[1] + step * c1_1[1]);
    var b2 = Math.round(istep * c1_0[2] + step * c1_1[2]);
    var color2 = "rgb(" + r2 + "," + g2 + "," + b2 + ")";

    $("#gradient")
      .css({
        background:
          "-webkit-gradient(linear, left top, right top, from(" +
          color1 +
          "), to(" +
          color2 +
          "))",
      })
      .css({
        background:
          "-moz-linear-gradient(left, " + color1 + " 0%, " + color2 + " 10%)",
      });

    step += gradientSpeed;
    if (step >= 1) {
      step %= 1;
      colorIndices[0] = colorIndices[1];
      colorIndices[2] = colorIndices[3];

      colorIndices[1] =
        (colorIndices[1] +
          Math.floor(1 + Math.random() * (colors.length - 1))) %
        colors.length;
      colorIndices[3] =
        (colorIndices[3] +
          Math.floor(1 + Math.random() * (colors.length - 1))) %
        colors.length;
    }
  }

  setInterval(updateGradient, 10);
}
gradientBg();

// function showcaseSyncScreens() {
//   // Configuration
//   const CFG = {
//     markers: false,
//     animations: {
//       popup: {
//         opacityDuration: 0.1,
//         phoneDuration: 0.4,
//         ease: "power1.in",
//       },
//       screen: {
//         duration: 0.5,
//         ease: "power2.in",
//       },
//     },
//   };

//   // Cache DOM elements
//   const $items = $("[showcase-item]");
//   const $screens = $("[showcase-screen]");
//   const $land = $("[showcase-land-screen]");
//   const $slideScreens = $("[showcase-slide-screen]");
//   const $navWrap = $("[nav-wrap]");
//   const $showcasePhone = $("[showcase-phone]");

//   // Early return if required elements don't exist
//   if (!$items.length || (!$screens.length && !$land.length)) return;

//   // Initialize screen positions
//   initializeScreenPositions();

//   // Get item keys for mapping
//   const keys = getItemKeys();

//   // Setup all functionality
//   setupScrollAnimations(keys);
//   setupPopupTriggers();
//   setupSlideNavigation();
//   setupPopupClose();

//   // ==================== INITIALIZATION ====================
//   function initializeScreenPositions() {
//     // Start screens off to the right
//     gsap.set($screens, { xPercent: 100 });
//     gsap.set($slideScreens, { xPercent: 100 });
//     // Land screen starts visible (centered)
//     if ($land.length) gsap.set($land, { xPercent: 0 });
//     // Set transform origin for showcase-phone
//     if ($showcasePhone.length) {
//       gsap.set($showcasePhone, { transformOrigin: "top left" });
//     }
//   }

//   function getItemKeys() {
//     return $items
//       .map(function () {
//         return $(this).attr("showcase-item");
//       })
//       .get();
//   }

//   // ==================== SCROLL ANIMATIONS ====================
//   function setupScrollAnimations(keys) {
//     $items.each(function (i) {
//       const key = keys[i];
//       if (!key) return;
//       const $currentScreen = $screens.filter(`[showcase-screen="${key}"]`);
//       if (!$currentScreen.length) return;
//       const $previousScreen = getPreviousScreen(i, keys);
//       createScrollTimeline(this, $currentScreen, $previousScreen);
//     });
//   }

//   function getPreviousScreen(index, keys) {
//     return index === 0
//       ? $land
//       : $screens.filter(`[showcase-screen="${keys[index - 1]}"]`);
//   }

//   function createScrollTimeline(trigger, $current, $previous) {
//     const timeline = gsap.timeline({
//       scrollTrigger: {
//         trigger: trigger,
//         start: "top 55%",
//         end: "bottom bottom",
//         scrub: true,
//         markers: CFG.markers,
//       },
//     });
//     // Current screen slides in from right (100% → 0%)
//     timeline.to($current, { xPercent: 0, ease: "power2.inOut" }, 0);
//     // Previous screen slides out to left (0% → -100%)
//     if ($previous && $previous.length) {
//       timeline.to($previous, { xPercent: -100, ease: "power2.inOut" }, 0);
//     }
//   }

//   // ==================== POPUP TRIGGERS ====================
//   function setupPopupTriggers() {
//     $("[showcase-item-btn]").on("click", function () {
//       const itemName = $(this).attr("showcase-item-btn");
//       openPopup(itemName);
//     });
//   }

//   function openPopup(itemName, slideIndex = 0) {
//     // Find the popup corresponding to the item
//     const $popup = $(`[showcase-item-popup="${itemName}"]`);
//     const $itemScreen = $screens.filter(`[showcase-screen="${itemName}"]`);
//     // Locate the showcase-phone-screens element that corresponds to the itemName
//     const $showcasePhoneScreens = $(`[showcase-phone-screens="${itemName}"]`);
//     // Find all slide screens within the showcase-phone-screens that match the itemName
//     const $allSlideScreens = $showcasePhoneScreens.find(
//       "[showcase-slide-screen]"
//     );

//     // Disable pointer events on item buttons
//     $(".item-btn").css("pointer-events", "none");

//     lenis.stop();
//     // Check if there are any slide screens available
//     if ($allSlideScreens.length === 0) {
//       console.error(`No slide screens found for item: ${itemName}`);
//       return; // Exit if no slides exist
//     }
//     // Get the first slide screen
//     const $firstSlideScreen = $allSlideScreens.eq(slideIndex);
//     // Show popup
//     $popup.css("display", "block");
//     // Hide nav-wrap
//     if ($navWrap.length) {
//       $navWrap.css("display", "none");
//     }
//     // Reset ALL slide screens to the right side BEFORE animating
//     gsap.set($allSlideScreens, { xPercent: 100 });
//     // Log the current state for debugging
//     console.log(`Opening popup for item: ${itemName}`);
//     console.log(`Item screen: `, $itemScreen);
//     console.log(`First slide screen: `, $firstSlideScreen);
//     // Check if the item screen and first slide screen exist before animating
//     if ($itemScreen.length && $firstSlideScreen.length) {
//       // Animate: item screen OUT (left), first slide screen IN (from right)
//       animateScreenTransition($itemScreen, $firstSlideScreen);
//       // Animate popup opening
//       animatePopupOpen($popup);
//     } else {
//       console.error("Animation targets not found:", {
//         itemScreenExists: $itemScreen.length > 0,
//         firstSlideScreenExists: $firstSlideScreen.length > 0,
//       });
//     }
//   }

//   function animatePopupOpen($popup) {
//     const timeline = gsap.timeline();
//     // Set initial state
//     gsap.set($popup, { opacity: 0 });
//     // Animate popup fade in (0.1s)
//     timeline.to(
//       $popup,
//       {
//         opacity: 1,
//         duration: CFG.animations.popup.opacityDuration,
//         ease: CFG.animations.popup.ease,
//       },
//       0
//     );
//     // Animate showcase-phone transformation (0.4s) - starts after opacity
//     if ($showcasePhone.length) {
//       timeline.to(
//         $showcasePhone,
//         {
//           x: "2rem",
//           y: "1rem",
//           scale: 2,
//           duration: CFG.animations.popup.phoneDuration,
//           ease: CFG.animations.popup.ease,
//         },
//         CFG.animations.popup.opacityDuration
//       ); // Starts at 0.1s
//     }
//   }

//   function animateScreenTransition($outgoing, $incoming) {
//     // Animate outgoing screen to the left
//     gsap.to($outgoing, {
//       xPercent: -100,
//       duration: CFG.animations.screen.duration,
//       ease: CFG.animations.screen.ease,
//     });
//     // Animate incoming screen from right to center
//     gsap.to($incoming, {
//       xPercent: 0,
//       duration: CFG.animations.screen.duration,
//       ease: CFG.animations.screen.ease,
//     });
//   }

//   // ==================== SLIDE NAVIGATION ====================
//   function setupSlideNavigation() {
//     $("[showcase-slide-btn]").on("click", function () {
//       const slideName = $(this).attr("showcase-slide-btn");
//       navigateToSlide(slideName);
//     });
//   }

//   function navigateToSlide(slideName) {
//     const $targetSlide = $slideScreens.filter(
//       `[showcase-slide-screen="${slideName}"]`
//     );
//     if (!$targetSlide.length) return;
//     hideVisibleSlides();
//     showSlide($targetSlide);
//   }

//   function hideVisibleSlides() {
//     $slideScreens.each(function () {
//       const $currentSlide = $(this);
//       const xPercent = gsap.getProperty(this, "xPercent");
//       if (xPercent === 0) {
//         gsap.to($currentSlide, {
//           xPercent: -100,
//           duration: CFG.animations.screen.duration,
//           ease: CFG.animations.screen.ease,
//           onComplete: function () {
//             gsap.set($currentSlide, { xPercent: 100 }); // Reset to right side
//           },
//         });
//       }
//     });
//   }

//   function showSlide($slide) {
//     gsap.to($slide, {
//       xPercent: 0,
//       duration: CFG.animations.screen.duration,
//       ease: CFG.animations.screen.ease,
//     });
//   }

//   // ==================== POPUP CLOSE ====================
//   function setupPopupClose() {
//     $("[showcase-popup-close]").on("click", function () {
//       const itemName = $(this).attr("showcase-popup-close");
//       closePopup(itemName);
//     });
//   }

//   function closePopup(itemName) {
//     const $popup = $(`[showcase-item-popup="${itemName}"]`);
//     const $itemScreen = $screens.filter(`[showcase-screen="${itemName}"]`);
//     const $allSlideScreens = $("[showcase-slide-screen]");
//     // Find which slide screen is currently visible (at xPercent: 0)
//     const $activeSlideScreen = $allSlideScreens.filter(function () {
//       return gsap.getProperty(this, "xPercent") === 0;
//     });

//     console.log(`Closing popup for item: ${itemName}`);
//     console.log(`Active slide screen: `, $activeSlideScreen);

//     // Animate popup closing
//     animatePopupClose($popup, function () {
//       // Reset ALL slide screens to the right side after popup is hidden
//       gsap.set($allSlideScreens, { xPercent: 100 });
//       lenis.start(); // Resume Lenis scrolling
//       // Enable pointer events on item buttons
//       $(".item-btn").css("pointer-events", "auto");
//       // Show nav-wrap after closing
//       if ($navWrap.length) {
//         $navWrap.css("display", "block");
//       }
//     });

//     // Reset item screen to the right side BEFORE animating
//     gsap.set($itemScreen, { xPercent: 100 });
//     // Start the animation of the item screen IN immediately
//     gsap.to($itemScreen, {
//       xPercent: 0,
//       duration: CFG.animations.screen.duration,
//       ease: CFG.animations.screen.ease,
//     });
//     // Animate: active slide screen OUT (left) if it exists
//     if ($activeSlideScreen.length) {
//       // Animate the active slide screen out
//       gsap.to($activeSlideScreen, {
//         xPercent: -100, // Move out to the left
//         duration: CFG.animations.screen.duration,
//         ease: CFG.animations.screen.ease,
//       });
//     }
//   }

//   function animatePopupClose($popup, onComplete) {
//     const timeline = gsap.timeline({
//       onComplete: onComplete,
//     });
//     // Animate popup fade out (0.1s)
//     timeline.to(
//       $popup,
//       {
//         opacity: 0,
//         duration: CFG.animations.popup.opacityDuration,
//         ease: CFG.animations.popup.ease,
//       },
//       0
//     );
//     // Animate showcase-phone back to original position (0.4s)
//     if ($showcasePhone.length) {
//       timeline.to(
//         $showcasePhone,
//         {
//           x: "0rem",
//           y: "0rem",
//           scale: 1,
//           duration: CFG.animations.popup.phoneDuration,
//           ease: CFG.animations.popup.ease,
//         },
//         CFG.animations.popup.opacityDuration
//       );
//     }
//   }
// }

// // Initialize
// showcaseSyncScreens();

function showcaseSyncScreens() {
  const ATTR = {
    item: "showcase-item",
    screen: "showcase-screen",
    slide: "showcase-slide-screen",
    itemBtn: "showcase-item-btn",
    popup: "showcase-item-popup",
    popupClose: "showcase-popup-close",
    phone: "showcase-phone",
    phoneScreens: "showcase-phone-screens",
  };

  const SEL = {
    items: `[${ATTR.item}]`,
    screens: `[${ATTR.screen}]`,
    slides: `[${ATTR.slide}]`,
    itemBtn: `[${ATTR.itemBtn}]`,
    popupClose: `[${ATTR.popupClose}]`,
    phone: `[${ATTR.phone}]`,
    phoneScreens: (name) => `[${ATTR.phoneScreens}="${name}"]`,
    popup: (name) => `[${ATTR.popup}="${name}"]`,
    screenBy: (name) => `[${ATTR.screen}="${name}"]`,
    slideBy: (name) => `[${ATTR.slide}="${name}"]`,
  };

  const CFG = {
    debug: true,
    markers: false,
    scroll: { start: "50% 50%", end: "50% 50%" },
    ease: { in: "power1.in", inOut: "power2.inOut", screen: "power2.in" },
    dur: { popupOpacity: 0.1, popupPhone: 0.4, screen: 0.5 },
    phoneOpen: { x: "2rem", y: "1rem", scale: 2 },
    phoneClosed: { x: "0rem", y: "0rem", scale: 1 },
    zeroEps: 0.001,
  };

  const $items = $(SEL.items);
  const $screens = $(SEL.screens);
  const $slidesAll = $(SEL.slides);
  const $navWrap = $("[nav-wrap]");
  const $phone = $(SEL.phone);
  const $textHide = $(".showcase-text-hide");

  if (!$items.length || !$screens.length) return;

  const itemKeys = $items
    .map(function () {
      return $(this).attr(ATTR.item);
    })
    .get();

  const screenByKey = new Map();
  $screens.each(function () {
    const k = $(this).attr(ATTR.screen);
    if (k) screenByKey.set(k, $(this));
  });

  const phoneScreensByKey = new Map();
  itemKeys.forEach((k) => {
    const $wrap = $(SEL.phoneScreens(k));
    phoneScreensByKey.set(k, $wrap.length ? $wrap.find(SEL.slides) : $());
  });

  gsap.set($screens, { xPercent: 100 });
  if ($phone.length) gsap.set($phone, { transformOrigin: "top left" });

  let activeIndex = 0;
  const firstKey = itemKeys[0];
  if (firstKey && screenByKey.get(firstKey)?.length) {
    gsap.set(screenByKey.get(firstKey), { xPercent: 0 });
    if (CFG.debug) console.log("[init] first visible:", firstKey, "index:", 0);
  }

  $items.each(function (i) {
    const key = itemKeys[i];
    if (!key) return;

    ScrollTrigger.create({
      trigger: this,
      start: CFG.scroll.start,
      end: CFG.scroll.end,
      markers: CFG.markers,
      onEnter: () => activateIndex(i),
      onEnterBack: () => activateIndex(i),
    });
  });

  $(document)
    .off("click.showcaseItemBtn")
    .on("click.showcaseItemBtn", SEL.itemBtn, function () {
      const itemName = $(this).attr(ATTR.itemBtn);
      if (CFG.debug) console.log("[click] item btn:", itemName);
      openPopup(itemName, 0);
    });

  $(document)
    .off("click.showcaseSlideBtn")
    .on("click.showcaseSlideBtn", "[showcase-slide-btn]", function () {
      const slideName = $(this).attr("showcase-slide-btn");
      if (CFG.debug)
        console.log(
          "[click] slide btn:",
          slideName,
          "currentItem:",
          currentItem
        );
      navigateToSlide(slideName);
    });

  $(document)
    .off("click.showcasePopupClose")
    .on("click.showcasePopupClose", SEL.popupClose, function () {
      const itemName = $(this).attr(ATTR.popupClose);
      if (CFG.debug)
        console.log("[click] popup close:", itemName || currentItem);
      closePopup(itemName);
    });

  let isOpen = false;
  let currentItem = null;

  function activateIndex(i) {
    if (i === activeIndex) {
      if (CFG.debug) console.log("[scroll] already active:", i, itemKeys[i]);
      return;
    }

    const direction = i > activeIndex ? "down" : "up";
    const currKey = itemKeys[i];
    const prevKey = itemKeys[activeIndex];

    const $curr = screenByKey.get(currKey) || $();
    const $prev = screenByKey.get(prevKey) || $();

    if (CFG.debug)
      console.log("[scroll] activate", {
        fromIndex: activeIndex,
        toIndex: i,
        fromKey: prevKey,
        toKey: currKey,
        direction,
      });

    if (direction === "up" && $curr.length) {
      gsap.set($curr, { xPercent: 100 });
      if (CFG.debug)
        console.log("[scroll] preset incoming to +100 for up-scroll:", currKey);
    }

    if ($prev.length) {
      gsap.to($prev, {
        xPercent: -100,
        duration: CFG.dur.screen,
        ease: CFG.ease.screen,
        overwrite: "auto",
      });
    }

    if ($curr.length) {
      gsap.to($curr, {
        xPercent: 0,
        duration: CFG.dur.screen,
        ease: CFG.ease.screen,
        overwrite: "auto",
      });
    }

    $screens
      .not($curr)
      .not($prev)
      .each(function () {
        gsap.set(this, { xPercent: 100 });
      });

    activeIndex = i;
  }

  function openPopup(itemName, slideIndex) {
    if (!itemName) return;

    if (isOpen && currentItem && currentItem !== itemName) {
      if (CFG.debug) console.log("[popup] force close other:", currentItem);
      closePopupImmediate(currentItem);
    }

    if (isOpen && currentItem === itemName) {
      const $slides = phoneScreensByKey.get(itemName) || $();
      if ($slides.length && typeof slideIndex === "number") {
        const $target = $slides.eq(slideIndex);
        if ($target.length) {
          const $active = $slides.filter(function () {
            const v = Number(gsap.getProperty(this, "xPercent")) || 0;
            return Math.abs(v) <= CFG.zeroEps;
          });
          if (CFG.debug)
            console.log("[popup] same item, jump slide:", slideIndex, {
              activeCount: $active.length,
            });
          if ($active.length) {
            gsap.to($active, {
              xPercent: -100,
              duration: CFG.dur.screen,
              ease: CFG.ease.screen,
              onComplete: () => gsap.set($active, { xPercent: 100 }),
            });
          }
          gsap.to($target, {
            xPercent: 0,
            duration: CFG.dur.screen,
            ease: CFG.ease.screen,
          });
        }
      }
      return;
    }

    const $popup = $(SEL.popup(itemName));
    const $itemScreen = screenByKey.get(itemName) || $();
    const $slides = phoneScreensByKey.get(itemName) || $();

    isOpen = true;
    currentItem = itemName;

    $(".item-btn").css("pointer-events", "none");
    $textHide.css("pointer-events", "none");
    if (typeof lenis !== "undefined" && lenis?.stop) lenis.stop();

    if (!$slides.length) {
      if (CFG.debug) console.warn("[popup] no slides for item:", itemName);
      isOpen = false;
      currentItem = null;
      $(".item-btn").css("pointer-events", "auto");
      $textHide.css("pointer-events", "auto");
      if (typeof lenis !== "undefined" && lenis?.start) lenis.start();
      return;
    }

    const $firstSlide = $slides.eq(slideIndex || 0);
    $popup.css("display", "block");
    if ($navWrap.length) $navWrap.css("display", "none");
    gsap.set($slides, { xPercent: 100 });

    if (CFG.debug)
      console.log("[popup] open:", itemName, {
        firstSlideIndex: slideIndex || 0,
      });

    if ($itemScreen.length && $firstSlide.length) {
      animateScreenTransition($itemScreen, $firstSlide);
      animatePopupOpen($popup);
    }
  }

  function closePopupImmediate(name) {
    const $popup = $(SEL.popup(name));
    const $slides = phoneScreensByKey.get(name) || $();

    if (CFG.debug) console.log("[popup] immediate close:", name);

    gsap.killTweensOf([$popup, $phone, $slides]);

    $popup.css("display", "none");
    gsap.set($popup, { opacity: 0, clearProps: "opacity,x,y,scale" });
    gsap.set($slides, { xPercent: 100 });

    if ($navWrap.length) $navWrap.css("display", "block");
    $(".item-btn").css("pointer-events", "auto");
    $textHide.css("pointer-events", "auto");
    if (typeof lenis !== "undefined" && lenis?.start) lenis.start();

    isOpen = false;
    currentItem = null;
  }

  function animatePopupOpen($popup) {
    const tl = gsap.timeline();
    gsap.set($popup, { opacity: 0 });
    tl.to(
      $popup,
      { opacity: 1, duration: CFG.dur.popupOpacity, ease: CFG.ease.in },
      0
    );
    if ($phone.length) {
      tl.to(
        $phone,
        { ...CFG.phoneOpen, duration: CFG.dur.popupPhone, ease: CFG.ease.in },
        CFG.dur.popupOpacity
      );
    }
    if (CFG.debug) console.log("[popup] open animation played");
  }

  function animateScreenTransition($outgoing, $incoming) {
    if (CFG.debug)
      console.log("[screen] transition", {
        outgoing: $outgoing.attr(ATTR.screen),
        incoming: $incoming.attr(ATTR.screen),
      });
    gsap.to($outgoing, {
      xPercent: -100,
      duration: CFG.dur.screen,
      ease: CFG.ease.screen,
    });
    gsap.to($incoming, {
      xPercent: 0,
      duration: CFG.dur.screen,
      ease: CFG.ease.screen,
    });
  }

  function navigateToSlide(slideName) {
    if (!slideName || !currentItem) return;

    const $scopedSlides = phoneScreensByKey.get(currentItem) || $();
    if (!$scopedSlides.length) return;

    const $target = $scopedSlides.filter(SEL.slideBy(slideName));
    if (!$target.length) return;

    const $active = $scopedSlides.filter(function () {
      const v = Number(gsap.getProperty(this, "xPercent")) || 0;
      return Math.abs(v) <= CFG.zeroEps;
    });

    if (CFG.debug)
      console.log("[slide] navigate", {
        currentItem,
        slideName,
        activeCount: $active.length,
      });

    if ($active.length) {
      gsap.to($active, {
        xPercent: -100,
        duration: CFG.dur.screen,
        ease: CFG.ease.screen,
        onComplete: () => gsap.set($active, { xPercent: 100 }),
      });
    }

    gsap.to($target, {
      xPercent: 0,
      duration: CFG.dur.screen,
      ease: CFG.ease.screen,
    });
  }

  function hideVisibleSlides() {
    $slidesAll.each(function () {
      const v = Number(gsap.getProperty(this, "xPercent")) || 0;
      if (Math.abs(v) <= CFG.zeroEps) {
        const $el = $(this);
        if (CFG.debug)
          console.log(
            "[slide] hide visible (global scope)",
            $el.attr(ATTR.slide)
          );
        gsap.to($el, {
          xPercent: -100,
          duration: CFG.dur.screen,
          ease: CFG.ease.screen,
          onComplete: () => gsap.set($el, { xPercent: 100 }),
        });
      }
    });
  }

  function showSlide($slide) {
    if (CFG.debug) console.log("[slide] show", $slide.attr(ATTR.slide));
    gsap.to($slide, {
      xPercent: 0,
      duration: CFG.dur.screen,
      ease: CFG.ease.screen,
    });
  }

  function closePopup(itemName) {
    if (!isOpen) return;
    const name = itemName || currentItem;
    const $popup = $(SEL.popup(name));
    const $itemScreen = screenByKey.get(name) || $();
    const $slides = phoneScreensByKey.get(name) || $();

    const $activeSlide = $slides.filter(function () {
      const v = Number(gsap.getProperty(this, "xPercent")) || 0;
      return Math.abs(v) <= CFG.zeroEps;
    });

    if (CFG.debug)
      console.log("[popup] closing:", name, {
        activeSlides: $activeSlide.length,
      });

    const tl = gsap.timeline({
      onComplete: function () {
        gsap.set($slides, { xPercent: 100 });
        if (typeof lenis !== "undefined" && lenis?.start) lenis.start();
        $(".item-btn").css("pointer-events", "auto");
        $textHide.css("pointer-events", "auto");
        if ($navWrap.length) $navWrap.css("display", "block");
        isOpen = false;
        currentItem = null;
        if (CFG.debug) console.log("[popup] closed");
      },
    });

    tl.to(
      $popup,
      { opacity: 0, duration: CFG.dur.popupOpacity, ease: CFG.ease.in },
      0
    );
    if ($phone.length) {
      tl.to(
        $phone,
        { ...CFG.phoneClosed, duration: CFG.dur.popupPhone, ease: CFG.ease.in },
        CFG.dur.popupOpacity
      );
    }

    gsap.set($itemScreen, { xPercent: 100 });
    gsap.to($itemScreen, {
      xPercent: 0,
      duration: CFG.dur.screen,
      ease: CFG.ease.screen,
    });

    if ($activeSlide.length) {
      gsap.to($activeSlide, {
        xPercent: -100,
        duration: CFG.dur.screen,
        ease: CFG.ease.screen,
      });
    }
  }
}

showcaseSyncScreens();
