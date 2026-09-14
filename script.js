const gallery = document.querySelector(".gallery");
const track = document.querySelector(".gallery__track");
const modal = document.querySelector(".work-modal");
const modalImage = document.querySelector(".work-modal__image");
const modalTitle = document.querySelector("#modal-title");
const modalEyebrow = document.querySelector(".work-modal__eyebrow");
const modalFile = document.querySelector(".work-modal__file");

const originalItems = Array.from(track.children);
originalItems.forEach((item) => {
  const clone = item.cloneNode(true);
  clone.setAttribute("aria-hidden", "true");
  track.appendChild(clone);
});

let offset = 0;
let speed = 0.16;
let targetSpeed = 0.16;
let isDragging = false;
let didDrag = false;
let lastDragAt = 0;
let pressedItem = null;
let dragStartX = 0;
let dragStartOffset = 0;
let halfWidth = 0;
let lastTime = performance.now();
let isModalOpen = false;
let galleryWheelTravel = 0;
const galleryWheelLimit = 680;

function buildPressureText() {
  const pressureTitle = document.querySelector(".text-pressure");
  if (!pressureTitle || pressureTitle.dataset.pressureReady === "true") return;

  pressureTitle.querySelectorAll(".contact-line").forEach((line) => {
    const lineChildren = Array.from(line.childNodes);
    line.textContent = "";
    line.classList.add("text-pressure-line");

    lineChildren.forEach((node) => {
      const segment = document.createElement("span");
      segment.className = "text-pressure-segment";

      if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains("contact-accent")) {
        segment.classList.add("is-accent");
      }

      const text = node.textContent || "";
      Array.from(text).forEach((char) => {
        const charNode = document.createElement("span");
        charNode.className = "text-pressure-char";
        charNode.innerHTML = char === " " ? "&nbsp;" : char;
        segment.appendChild(charNode);
      });

      line.appendChild(segment);
    });
  });

  pressureTitle.dataset.pressureReady = "true";
}

buildPressureText();

const revealItems = document.querySelectorAll(
  ".portfolio-section__heading, .work-case, .strength-card, .contact-intro > p, .contact-intro h2, .contact-brand, .contact-panel-large",
);

function measure() {
  halfWidth = track.scrollWidth / 2;
  offset = normalize(offset);
  render();
}

function normalize(value) {
  if (!halfWidth) return value;
  let next = value % halfWidth;
  if (next < 0) next += halfWidth;
  return next;
}

function render() {
  track.style.transform = `translate3d(${-offset}px, 0, 0)`;
}

function animate(now) {
  const delta = Math.min(40, now - lastTime);
  lastTime = now;
  speed += (targetSpeed - speed) * 0.08;

  if (!isDragging && !isModalOpen && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    offset = normalize(offset + speed * delta);
    render();
  }

  requestAnimationFrame(animate);
}

gallery.addEventListener(
  "wheel",
  (event) => {
    const movement = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    const shouldDriveGallery = window.scrollY < 8 && galleryWheelTravel < galleryWheelLimit;

    if (!shouldDriveGallery || movement < 0) {
      galleryWheelTravel = Math.max(0, galleryWheelTravel + movement);
      return;
    }

    event.preventDefault();
    galleryWheelTravel += Math.abs(movement);
    offset = normalize(offset + movement * 0.95);
    render();
  },
  { passive: false },
);

gallery.addEventListener("mouseenter", () => {
  targetSpeed = 0.32;
});

gallery.addEventListener("mouseleave", () => {
  targetSpeed = 0.16;
});

gallery.addEventListener("pointerdown", (event) => {
  isDragging = true;
  didDrag = false;
  pressedItem = event.target.closest(".gallery__item");
  dragStartX = event.clientX;
  dragStartOffset = offset;
  gallery.setPointerCapture(event.pointerId);
});

gallery.addEventListener("pointermove", (event) => {
  if (!isDragging) return;
  if (Math.abs(event.clientX - dragStartX) > 6) {
    didDrag = true;
    lastDragAt = performance.now();
  }
  offset = normalize(dragStartOffset - (event.clientX - dragStartX));
  render();
});

gallery.addEventListener("pointerup", (event) => {
  isDragging = false;
  gallery.releasePointerCapture(event.pointerId);
  if (pressedItem && !didDrag) openModal(pressedItem);
  pressedItem = null;
});

gallery.addEventListener("pointercancel", () => {
  isDragging = false;
  pressedItem = null;
});

track.addEventListener("click", (event) => {
  const item = event.target.closest(".gallery__item");
  if (!item || performance.now() - lastDragAt < 140) return;
  openModal(item);
});

function openModal(item) {
  const image = item.querySelector("img");
  modalImage.src = image.currentSrc || image.src;
  modalImage.alt = image.alt;
  modalTitle.textContent = item.dataset.title || image.alt || "AI视觉作品";
  modalEyebrow.textContent = item.dataset.subtitle || "SELECTED WORK";
  modalFile.textContent = item.dataset.file || image.getAttribute("src").split("/").pop();
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  isModalOpen = true;
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  isModalOpen = false;
}

modal.addEventListener("click", (event) => {
  if (event.target.closest("[data-modal-close]")) closeModal();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isModalOpen) closeModal();
});

window.addEventListener("resize", measure);
window.addEventListener("load", measure);
window.addEventListener("scroll", () => {
  if (window.scrollY < 8) return;
  galleryWheelTravel = galleryWheelLimit;
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
  );

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 8, 5) * 80}ms`;
    revealObserver.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

document.querySelectorAll(".strength-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const spotX = ((event.clientX - rect.left) / rect.width) * 100;
    const spotY = ((event.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty("--spot-x", `${spotX}%`);
    card.style.setProperty("--spot-y", `${spotY}%`);
  });
});

document.querySelectorAll(".text-pressure").forEach((title) => {
  const chars = Array.from(title.querySelectorAll(".text-pressure-char"));

  function resetPressure() {
    chars.forEach((char) => {
      char.style.transform = "scaleX(1) scaleY(1)";
      char.style.fontWeight = "500";
      char.style.letterSpacing = "0em";
    });
  }

  title.addEventListener("pointermove", (event) => {
    chars.forEach((char) => {
      const rect = char.getBoundingClientRect();
      const charX = rect.left + rect.width / 2;
      const charY = rect.top + rect.height / 2;
      const distance = Math.hypot(event.clientX - charX, event.clientY - charY);
      const pressure = Math.max(0, 1 - distance / 170);
      const scaleY = 1 + pressure * 0.18;
      const scaleX = 1 - pressure * 0.08;
      const weight = Math.round(500 + pressure * 360);
      const spacing = pressure * -0.018;

      char.style.transform = `scaleX(${scaleX.toFixed(3)}) scaleY(${scaleY.toFixed(3)})`;
      char.style.fontWeight = String(weight);
      char.style.letterSpacing = `${spacing.toFixed(3)}em`;
    });
  });

  title.addEventListener("pointerleave", resetPressure);
  resetPressure();
});

measure();
requestAnimationFrame(animate);
