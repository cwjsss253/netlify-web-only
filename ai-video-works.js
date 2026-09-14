const board = document.querySelector("#video-board");
const modal = document.querySelector(".video-modal");
const modalPlayer = document.querySelector(".video-modal__player");
const modalTitle = document.querySelector(".video-modal__caption p");
const modalMeta = document.querySelector(".video-modal__caption span");
const modalClose = document.querySelector(".video-modal__close");

const categories = new Map();
const videoObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadCardVideo(entry.target);
              videoObserver.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "720px 0px" },
      )
    : null;

function getVideoSource(item) {
  if (window.location.protocol === "file:" || !item.src.startsWith("file:")) {
    return item.src;
  }

  const localPath = decodeURIComponent(new URL(item.src).pathname);
  const videoRoot = "/E:/视频/";
  const relativePath = localPath.startsWith(videoRoot)
    ? localPath.slice(videoRoot.length)
    : localPath.split("/").slice(-1)[0];
  const encodedPath = relativePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  const videoBaseUrl = (window.VIDEO_BASE_URL || "./videos").replace(/\/+$/, "");
  return `${videoBaseUrl}/${encodedPath}`;
}

window.AI_VIDEO_WORKS
  .filter((item) => item.title !== "横版国内漫剧2")
  .forEach((item) => {
  if (!categories.has(item.category)) {
    categories.set(item.category, []);
  }
  categories.get(item.category).push(item);
  });

function cleanVisibleText(text) {
  return text.replaceAll("冰川", "");
}

function loadCardVideo(card) {
  const video = card.querySelector("video");
  if (!video || video.src) {
    return;
  }

  video.src = video.dataset.src;
  video.preload = "metadata";
}

function createCategory(name, videos) {
  const section = document.createElement("section");
  section.className = "video-category";
  section.innerHTML = `
    <header class="video-category__heading">
      <h2>${cleanVisibleText(name)}</h2>
      <span>${videos.length.toString().padStart(2, "0")} WORKS</span>
    </header>
    <div class="video-orientation" data-orientation="landscape">
      <h3 class="video-orientation__title">横版视频</h3>
      <div class="video-grid"></div>
    </div>
    <div class="video-orientation" data-orientation="portrait">
      <h3 class="video-orientation__title">竖版视频</h3>
      <div class="video-grid"></div>
    </div>
  `;

  const landscapeGrid = section.querySelector('[data-orientation="landscape"] .video-grid');
  const portraitGrid = section.querySelector('[data-orientation="portrait"] .video-grid');

  videos.forEach((item) => {
    const card = createCard(item);
    const probe = card.querySelector("video");
    landscapeGrid.appendChild(card);
    if (videoObserver) {
      videoObserver.observe(card);
    } else {
      loadCardVideo(card);
    }

    probe.addEventListener(
      "loadedmetadata",
      () => {
        const isLandscape = probe.videoWidth >= probe.videoHeight;
        card.classList.toggle("is-portrait", !isLandscape);
        const targetGrid = isLandscape ? landscapeGrid : portraitGrid;
        targetGrid.appendChild(card);
        sortCardsByName(isLandscape ? landscapeGrid : portraitGrid);
        updateEmptyStates(section);
      },
      { once: true },
    );

    probe.addEventListener(
      "error",
      () => {
        landscapeGrid.appendChild(card);
        sortCardsByName(landscapeGrid);
        updateEmptyStates(section);
      },
      { once: true },
    );
  });

  requestAnimationFrame(() => updateEmptyStates(section));
  return section;
}

function sortCardsByName(grid) {
  [...grid.querySelectorAll(".video-card")]
    .sort((firstCard, secondCard) =>
      firstCard.dataset.title.localeCompare(secondCard.dataset.title, "zh-CN", {
        numeric: true,
        sensitivity: "base",
      }),
    )
    .forEach((card) => grid.appendChild(card));
}

function createCard(item) {
  const button = document.createElement("button");
  button.className = "video-card";
  button.type = "button";
  button.dataset.title = item.title;
  button.innerHTML = `
    <div class="video-card__media">
      <video data-src="${getVideoSource(item)}" muted playsinline preload="none"></video>
      <span class="video-card__index">${cleanVisibleText(item.title)}</span>
    </div>
  `;

  const video = button.querySelector("video");

  button.addEventListener("mouseenter", () => {
    loadCardVideo(button);
    video.play().catch(() => {});
  });

  button.addEventListener("mouseleave", () => {
    video.pause();
    video.currentTime = 0;
  });

  button.addEventListener("click", () => {
    loadCardVideo(button);
    openVideo(item);
  });

  return button;
}

function updateEmptyStates(section) {
  section.querySelectorAll(".video-orientation").forEach((group) => {
    const grid = group.querySelector(".video-grid");
    let empty = group.querySelector(".video-empty");

    if (grid.children.length === 0) {
      if (!empty) {
        empty = document.createElement("div");
        empty.className = "video-empty";
        empty.textContent = "正在识别视频方向…";
        group.appendChild(empty);
      }
    } else if (empty) {
      empty.remove();
    }
  });
}

function openVideo(item) {
  modalPlayer.src = getVideoSource(item);
  modalTitle.textContent = cleanVisibleText(item.title);
  modalMeta.textContent = cleanVisibleText(
    `${item.category}${item.subfolder ? ` / ${item.subfolder}` : ""} · ${item.filename}`,
  );
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  modalPlayer.play().catch(() => {});
}

function closeVideo() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  modalPlayer.pause();
  modalPlayer.removeAttribute("src");
  modalPlayer.load();
}

categories.forEach((videos, name) => {
  board.appendChild(createCategory(name, videos));
});

modalClose.addEventListener("click", closeVideo);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeVideo();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("is-open")) {
    closeVideo();
  }
});
