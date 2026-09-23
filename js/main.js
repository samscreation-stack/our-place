/* =========================================================
   OUR PLACE
   PHASE 1.2 — MEMORY WALL ENGINE
========================================================= */

/* =========================================================
   DEMO MEMORY DATA
========================================================= */

/*
    This is temporary data.

    Later:
        Supabase → replaces this array.

    The important field is:

        memoryDate

    That is when the memory actually happened.

    uploadDate is intentionally separate.
*/

const memories = [
  {
    id: 1,
    type: "photo",
    title: "One of those evenings.",
    description: "Nothing extraordinary. That's why I remember it.",
    memoryDate: "2026-09-18T19:30:00",
    uploadDate: "2026-09-18T20:02:00",
    color: "landscape",
  },

  {
    id: 2,
    type: "note",
    title: "",
    description: "I hope we never become too busy to notice little things like this.",
    memoryDate: "2026-09-14T16:20:00",
    uploadDate: "2026-09-20T11:12:00",
  },

  {
    id: 3,
    type: "poem",
    title: "For you",
    description: "Even the smallest moments with you feel like big dreams.",
    memoryDate: "2026-08-14T22:10:00",
    uploadDate: "2026-09-01T09:10:00",
  },

  {
    id: 4,
    type: "photo",
    title: "",
    description: "",
    memoryDate: "2026-08-07T17:45:00",
    uploadDate: "2026-08-09T12:00:00",
    color: "green",
  },

  {
    id: 5,
    type: "letter",
    title: "To the version of us who hasn't arrived yet",
    description:
      "There will be days we forget. I hope this little place remembers them for us.",
    memoryDate: "2026-06-12T21:15:00",
    uploadDate: "2026-09-21T22:00:00",
  },

  {
    id: 6,
    type: "photo-cluster",
    title: "Three little moments",
    description: "Three photographs from one very ordinary day.",
    memoryDate: "2026-05-18T17:40:00",
    uploadDate: "2026-05-19T09:00:00",
    color: "mixed",
  },

  {
    id: 7,
    type: "milestone",
    title: "A chapter worth remembering",
    description: "Some days quietly change the shape of everything that comes after them.",
    memoryDate: "2026-03-20T18:00:00",
    uploadDate: "2026-09-21T23:10:00",
  },

  {
    id: 8,
    type: "note",
    title: "",
    description: "Same sky. Different place. Still us.",
    memoryDate: "2026-05-01T18:00:00",
    uploadDate: "2026-09-18T13:00:00",
  },

  {
    id: 9,
    type: "photo",
    title: "The beginning.",
    description: "Keep this one.",
    memoryDate: "2026-01-01T08:00:00",
    uploadDate: "2026-09-21T23:00:00",
    color: "room",
  },

  {
    id: 10,
    type: "note",
    title: "",
    description: "You. me. and a million beautiful tomorrows.",
    memoryDate: "2026-01-01T21:30:00",
    uploadDate: "2026-09-21T23:10:00",
  },
];

/* =========================================================
   MEMORY COMPOSER STATE
========================================================= */

let selectedMemoryType = "photo";

let selectedFiles = [];

let editingMemoryId = null;

/*
    Demo-only password required to confirm a deletion.
    Type this into the "Delete ID password" field.
*/

const DEMO_DELETE_ID = "ourplace";

/* =========================================================
   APP START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    setupNavigation();
    setupAccountSettings();
    setupMemoryButton();
    setupMemoryOverlay();
    setupComposer();
    setupDeleteSystem();
    setupMemoryEditing();
    setupBrickWallObserver();

    renderWall();
    await loadMemoriesFromSupabase();

    const supabase = window.ourPlaceSupabase;

    if (supabase) {
      supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN") {
          setTimeout(() => {
            loadMemoriesFromSupabase();
          }, 0);
        }

        if (event === "SIGNED_OUT") {
          memories.splice(0, memories.length);
          renderWall();
        }
      });
    }
  }
);

/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {
  const navigationLinks = document.querySelectorAll(".rail-link[data-view]");

  const views = document.querySelectorAll(".view, .view-placeholder");

  navigationLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const target = link.dataset.view;

      navigationLinks.forEach((item) => {
        item.classList.remove("active");
      });

      views.forEach((view) => {
        view.classList.remove("active-view");
      });

      link.classList.add("active");

      const selectedView = document.getElementById(`${target}-view`);

      if (!selectedView) {
        return;
      }

      selectedView.classList.add("active-view");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  });
}

/* =========================================================
   ACCOUNT / SETTINGS
========================================================= */

function setupAccountSettings() {
  const emailElement =
    document.getElementById("accountEmail");

  const signOutButton =
    document.getElementById("signOutButton");

  if (!emailElement || !signOutButton) {
    return;
  }

  async function loadAccountDetails() {
    const supabase = window.ourPlaceSupabase;

    if (!supabase) {
      emailElement.textContent = "Account unavailable";
      return;
    }

    const {
      data,
      error,
    } = await supabase.auth.getUser();

    if (error || !data.user) {
      emailElement.textContent = "Not signed in";
      return;
    }

    emailElement.textContent =
      data.user.email || "Private account";
  }

  loadAccountDetails();

  signOutButton.addEventListener(
    "click",
    async () => {

      const supabase =
        window.ourPlaceSupabase;

      if (!supabase) {
        return;
      }

      const originalHTML =
        signOutButton.innerHTML;

      signOutButton.disabled = true;

      signOutButton.innerHTML = `
        <span>Signing out…</span>
      `;

      const {
        error,
      } = await supabase.auth.signOut();

      if (error) {

        console.error(
          "Our Place: sign out failed.",
          error
        );

        signOutButton.disabled = false;

        signOutButton.innerHTML =
          originalHTML;

        alert(
          `Could not sign out.\n\n${error.message}`
        );

        return;
      }

      /*
        auth.js already watches Supabase
        authentication state.

        SIGNED_OUT will therefore return
        the interface to the login gate.
      */
    }
  );


  supabaseAuthAccountListener();
}


/* =========================================================
   ACCOUNT AUTH STATE LISTENER
========================================================= */

function supabaseAuthAccountListener() {
  const supabase = window.ourPlaceSupabase;

  const emailElement =
    document.getElementById("accountEmail");

  if (!supabase || !emailElement) {
    return;
  }

  supabase.auth.onAuthStateChange(
    (event, session) => {

      if (event === "SIGNED_IN" && session?.user) {
        emailElement.textContent =
          session.user.email ||
          "Private account";
      }

      if (event === "SIGNED_OUT") {
        emailElement.textContent =
          "Not signed in";
      }
    }
  );
}

function renderBrickWall() {
  const wall = document.getElementById("wall-memories");
  const brickGrid = document.getElementById("wall-brick-grid");

  if (!wall || !brickGrid) return;

  brickGrid.innerHTML = "";

  const wallHeight = Math.max(
    wall.scrollHeight,
    wall.clientHeight
  );

  const rowHeight = window.innerWidth <= 700 ? 39 : 50;
  const rowCount = Math.ceil(wallHeight / rowHeight) + 4;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = document.createElement("div");

    row.className =
      rowIndex % 2 === 0
        ? "wall-brick-row"
        : "wall-brick-row offset";

    const brickCount =
      window.innerWidth <= 700 ? 8 : 12;

    for (let brickIndex = 0; brickIndex < brickCount; brickIndex += 1) {
      const brick = document.createElement("span");
      brick.className = "wall-brick";

      row.appendChild(brick);
    }

    brickGrid.appendChild(row);
  }
}

let wallBrickResizeObserver = null;

function setupBrickWallObserver() {
  const wallLayer = document.getElementById("wall-memory-layer");

  if (!wallLayer || wallBrickResizeObserver) return;

  wallBrickResizeObserver = new ResizeObserver(() => {
    renderBrickWall();
  });

  wallBrickResizeObserver.observe(wallLayer);
}

/* =========================================================
   MEMORY WALL
========================================================= */

function renderWall() {
  const wall = document.getElementById("wall-memories");
  const wallLayer = document.getElementById("wall-memory-layer");

  if (!wall || !wallLayer) {
    return;
  }

  /*
    Sort by the actual memory date/time.
  */

  const sortedMemories = [...memories].sort((a, b) => {
    return new Date(b.memoryDate) - new Date(a.memoryDate);
  });

  wallLayer.innerHTML = "";

  /*
    Group memories by calendar date.

    Example:

    23 SEP 2026
        memory A
        memory B
        memory C

    22 SEP 2026
        memory D
        memory E
  */

  const dateGroups = new Map();

  sortedMemories.forEach((memory) => {
    const date = new Date(memory.memoryDate);

    const dateKey =
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    if (!dateGroups.has(dateKey)) {
      dateGroups.set(dateKey, []);
    }

    dateGroups.get(dateKey).push(memory);
  });

  let globalIndex = 0;

  dateGroups.forEach((groupMemories) => {
    const segment = document.createElement("section");

    segment.className = "memory-date-segment";

    segment.dataset.memoryDate =
      groupMemories[0].memoryDate;

    /*
      One date label for the entire segment.
    */

    const dateStamp = createDateStamp(
      groupMemories[0].memoryDate
    );

    dateStamp.classList.add("date-segment-stamp");

    segment.appendChild(dateStamp);

    /*
      Every memory for this date lives
      inside the same physical segment.
    */

    groupMemories.forEach((memory) => {
      const element = createMemoryElement(
        memory,
        globalIndex,
        false
      );

      segment.appendChild(element);

      globalIndex += 1;
    });

    wallLayer.appendChild(segment);
  });

  createWallEnd(wallLayer);
  renderBrickWall();
}

/* =========================================================
   LOAD MEMORIES FROM SUPABASE
========================================================= */

async function loadMemoriesFromSupabase() {
  const supabase = window.ourPlaceSupabase;

  if (!supabase) {
    return;
  }

  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user) {
    return;
  }

  const { data: memoryRows, error: memoryError } =
    await supabase
      .from("memories")
      .select(
        "id, type, title, description, memory_date, created_by, created_at, updated_at, layout, rotation"
      )
      .order("memory_date", { ascending: false });

  if (memoryError) {
    console.error("Our Place: could not load memories.", memoryError);
    return;
  }

  const rows = memoryRows || [];

  if (rows.length === 0) {
    memories.splice(0, memories.length);
    renderWall();
    return;
  }

  const memoryIds = rows.map((row) => row.id);

  const { data: imageRows, error: imageError } =
    await supabase
      .from("memory_images")
      .select("id, memory_id, storage_path, sort_order, alt_text")
      .in("memory_id", memoryIds)
      .order("sort_order", { ascending: true });

  if (imageError) {
    console.error("Our Place: could not load memory images.", imageError);
  }

  const loadedImageRows = imageRows || [];
  const imagePaths = loadedImageRows.map((row) => row.storage_path);
  const signedUrlMap = new Map();

  if (imagePaths.length > 0) {
    const storage = supabase.storage.from("memory-images");

    const { data: signedData, error: signedError } =
      await storage.createSignedUrls(imagePaths, 86400);

    if (signedError) {
      console.error("Our Place: could not create image URLs.", signedError);
    } else {
      (signedData || []).forEach((item) => {
        if (item && item.path && item.signedUrl) {
          signedUrlMap.set(item.path, item.signedUrl);
        }
      });
    }
  }

  const imagesByMemory = new Map();

  loadedImageRows.forEach((row) => {
    const signedUrl = signedUrlMap.get(row.storage_path);

    if (!signedUrl) {
      return;
    }

    if (!imagesByMemory.has(row.memory_id)) {
      imagesByMemory.set(row.memory_id, []);
    }

    imagesByMemory.get(row.memory_id).push({
      url: signedUrl,
      sortOrder: row.sort_order,
      altText: row.alt_text || "",
    });
  });

  const loadedMemories = rows.map((row) => {
    const memoryImages = imagesByMemory.get(row.id) || [];

    memoryImages.sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      id: row.id,
      type: row.type,
      title: row.title || "",
      description: row.description || "",
      memoryDate: row.memory_date,
      uploadDate: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      layout: row.layout,
      rotation: row.rotation,
      color: getDemoColorForMemory(row.memory_date),
      imageData: memoryImages.map((image) => image.url),
    };
  });

  memories.splice(0, memories.length, ...loadedMemories);
  renderWall();
}

/* =========================================================
   CREATE MEMORY
========================================================= */

function createMemoryElement(memory, index, showDateStamp = true) {
  const wrapper = document.createElement("div");

  wrapper.className = "wall-memory dynamic-memory";

  /*
    Chronology and visual type are separate.
 
    memoryDate:
        controls WHERE the memory belongs.
 
    type:
        controls HOW the memory looks.
*/

  wrapper.classList.add(`memory-type-${memory.type}`);

  /*
    Additional visual composition.
*/

  wrapper.classList.add(`layout-${getMemoryLayout(memory)}`);

  wrapper.dataset.memoryDate = memory.memoryDate;

  wrapper.dataset.memoryType = memory.type;

  wrapper.dataset.memoryId = memory.id;

  /*
    Give different memories slightly
    different vertical rhythm.

    This is NOT chronological logic.

    It is purely visual.
*/

  if (index % 4 === 0) {
    wrapper.classList.add("memory-large");
  } else if (index % 4 === 1) {
    wrapper.classList.add("memory-medium");
  } else if (index % 4 === 2) {
    wrapper.classList.add("memory-wide");
  } else {
    wrapper.classList.add("memory-final");
  }

  if (showDateStamp) {
    wrapper.appendChild(createDateStamp(memory.memoryDate));
  }

  /*
    Different memory types
    get different physical objects.
*/

  switch (memory.type) {
    case "photo":
      wrapper.appendChild(createPhotoMemory(memory, index));

      break;

    case "poem":
      wrapper.appendChild(createPoemMemory(memory, index));

      break;

    case "note":
      wrapper.appendChild(createNoteMemory(memory, index));

      break;

    case "letter":
      wrapper.appendChild(createLetterMemory(memory, index));

      break;

    case "photo-cluster":
      wrapper.appendChild(createPhotoCluster(memory, index));

      break;

    case "milestone":
      wrapper.appendChild(createMilestoneMemory(memory, index));

      break;
  }

  /*
  One click target for the whole memory object.
*/

  wrapper.addEventListener("click", () => {
    openMemory(memory.id);
  });

  return wrapper;
}

/* =========================================================
   DATE STAMP
========================================================= */

function createDateStamp(dateString) {
  const date = new Date(dateString);

  const container = document.createElement("div");

  container.className = "memory-date-stamp";

  const day = document.createElement("span");

  day.className = "memory-day";

  day.textContent = String(date.getDate()).padStart(2, "0");

  const month = document.createElement("span");

  month.className = "memory-month";

  month.textContent = date
    .toLocaleString("en-US", {
      month: "short",
    })
    .toUpperCase();

  const year = document.createElement("span");

  year.className = "memory-year";

  year.textContent = date.getFullYear();

  container.appendChild(day);

  container.appendChild(month);

  container.appendChild(year);

  return container;
}

/* =========================================================
   PHOTO MEMORY
========================================================= */

function createPhotoMemory(memory, index) {
  const article = document.createElement("article");

  article.className = "memory-photo";

  if (index % 3 === 0) {
    article.classList.add("memory-photo-wide");
  } else {
    article.classList.add("memory-photo-small");
  }

  const pin = document.createElement("span");

  pin.className = "pin pin-rose";

  const paper = document.createElement("div");

  paper.className = "photo-paper";

  const image = document.createElement("div");

  image.className = `photo-image sample-${memory.color}`;

  if (memory.imageData && memory.imageData.length > 0) {
    image.innerHTML = `
        <img
            src="${memory.imageData[0]}"
            alt="${escapeHTML(memory.title || "Memory photograph")}"
        >
    `;
  } else {
    image.innerHTML = `<span>photograph</span>`;
  }

  const bottom = document.createElement("div");

  bottom.className = "photo-bottom";

  if (memory.title) {
    const title = document.createElement("h2");

    title.textContent = memory.title;

    bottom.appendChild(title);
  }

  if (memory.description) {
    const description = document.createElement("p");

    description.textContent = memory.description;

    bottom.appendChild(description);
  }

  paper.appendChild(image);

  paper.appendChild(bottom);

  article.appendChild(pin);

  article.appendChild(paper);

  /*
    Small visual rotation.

    The data remains unchanged.
*/

  article.style.setProperty("--memory-rotation", `${getMemoryRotation(memory)}deg`);

  return article;
}

/* =========================================================
   POEM MEMORY
========================================================= */

function createPoemMemory(memory, index) {
  const article = document.createElement("article");

  article.className = "paper-memory poem-paper";

  const pin = document.createElement("span");

  pin.className = "pin pin-dark";

  const label = document.createElement("p");

  label.className = "paper-type";

  label.textContent = "A little poem";

  const title = document.createElement("h2");

  title.textContent = memory.title;

  const poem = document.createElement("p");

  poem.className = "poem-text";

  poem.textContent = memory.description;

  const signature = document.createElement("span");

  signature.className = "paper-signature";

  signature.textContent = "— S";

  article.appendChild(pin);

  article.appendChild(label);

  article.appendChild(title);

  article.appendChild(poem);

  article.appendChild(signature);

  article.style.setProperty("--memory-rotation", `${getMemoryRotation(memory)}deg`);

  return article;
}

/* =========================================================
   NOTE MEMORY
========================================================= */

function createNoteMemory(memory, index) {
  const article = document.createElement("article");

  article.className = "small-note";

  const pin = document.createElement("span");

  pin.className = "pin pin-brown";

  const content = document.createElement("div");

  content.className = "note-content";

  const label = document.createElement("span");

  label.className = "note-label";

  label.textContent = "SMALL THING";

  const text = document.createElement("p");

  text.textContent = memory.description;

  content.appendChild(label);

  content.appendChild(text);

  article.appendChild(pin);

  article.appendChild(content);

  article.style.setProperty("--memory-rotation", `${getMemoryRotation(memory)}deg`);

  return article;
}

/* =========================================================
   LETTER MEMORY
========================================================= */

function createLetterMemory(memory, index) {
  const article = document.createElement("article");

  article.className = "letter-memory";

  const pin = document.createElement("span");

  pin.className = "pin pin-brown";

  const envelope = document.createElement("div");

  envelope.className = "letter-paper";

  const label = document.createElement("p");

  label.className = "letter-label";

  label.textContent = "A LETTER";

  const title = document.createElement("h2");

  title.textContent = memory.title;

  const content = document.createElement("p");

  content.className = "letter-text";

  content.textContent = memory.description;

  const signature = document.createElement("span");

  signature.className = "letter-signature";

  signature.textContent = "— S";

  envelope.appendChild(label);

  envelope.appendChild(title);

  envelope.appendChild(content);

  envelope.appendChild(signature);

  article.appendChild(pin);

  article.appendChild(envelope);

  article.style.setProperty("--memory-rotation", `${getMemoryRotation(memory)}deg`);

  return article;
}

/* =========================================================
   PHOTO CLUSTER
========================================================= */

function createPhotoCluster(memory, index) {
  const article = document.createElement("article");

  article.className = "photo-cluster";

  const pin = document.createElement("span");

  pin.className = "pin pin-rose";

  const photos = document.createElement("div");

  photos.className = "cluster-photos";

  const colors = ["sample-landscape", "sample-green", "sample-flower"];

  const clusterImages = memory.imageData && memory.imageData.length > 0 ? memory.imageData : [];

  const imagesToRender = clusterImages.length > 0 ? clusterImages.slice(0, 3) : colors;

  imagesToRender.forEach((imageSource, photoIndex) => {
    const photo = document.createElement("div");

    photo.className = `cluster-photo cluster-${(photoIndex % 3) + 1}`;

    const imageClass = clusterImages.length > 0 ? "" : imageSource;

    photo.innerHTML = `
            <div
                class="
                    cluster-image
                    ${imageClass}
                "
            >
                ${clusterImages.length > 0
        ? `
                        <img
                            src="${imageSource}"
                            alt="Memory photograph"
                        >
                    `
        : `
                        <span>
                            photograph
                        </span>
                    `
      }
            </div>
        `;

    photos.appendChild(photo);
  });

  const caption = document.createElement("div");

  caption.className = "cluster-caption";

  const title = document.createElement("h2");

  title.textContent = memory.title;

  const description = document.createElement("p");

  description.textContent = memory.description;

  caption.appendChild(title);

  caption.appendChild(description);

  article.appendChild(pin);

  article.appendChild(photos);

  article.appendChild(caption);

  article.style.setProperty("--memory-rotation", `${getMemoryRotation(memory)}deg`);

  return article;
}

/* =========================================================
   MILESTONE
========================================================= */

function createMilestoneMemory(memory, index) {
  const article = document.createElement("article");

  article.className = "milestone-memory";

  const pin = document.createElement("span");

  pin.className = "pin pin-dark";

  const ring = document.createElement("div");

  ring.className = "milestone-ring";

  ring.innerHTML = `
        <span class="milestone-symbol">
            ♡
        </span>
    `;

  const content = document.createElement("div");

  content.className = "milestone-content";

  const label = document.createElement("p");

  label.className = "milestone-label";

  label.textContent = "A CHAPTER";

  const title = document.createElement("h2");

  title.textContent = memory.title;

  const description = document.createElement("p");

  description.textContent = memory.description;

  content.appendChild(label);

  content.appendChild(title);

  content.appendChild(description);

  article.appendChild(pin);

  article.appendChild(ring);

  article.appendChild(content);

  article.style.setProperty("--memory-rotation", `${getMemoryRotation(memory)}deg`);

  return article;
}

/* =========================================================
   MEMORY OVERLAY
========================================================= */

let currentMemoryIndex = 0;

/* =========================================================
   OVERLAY SETUP
========================================================= */

function setupMemoryOverlay() {
  const overlay = document.getElementById("memoryOverlay");

  const closeButton = document.getElementById("memoryClose");

  const backdrop = document.querySelector(".memory-overlay-backdrop");

  const previousButton = document.getElementById("previousMemory");

  const nextButton = document.getElementById("nextMemory");

  if (!overlay) {
    return;
  }

  closeButton.addEventListener("click", closeMemory);

  backdrop.addEventListener("click", closeMemory);

  previousButton.addEventListener("click", () => {
    moveMemory(-1);
  });

  nextButton.addEventListener("click", () => {
    moveMemory(1);
  });

  document.addEventListener("keydown", (event) => {
    const deleteOverlay = document.getElementById("deleteOverlay");

    const deleteIsOpen = deleteOverlay && deleteOverlay.classList.contains("is-open");

    /*
      Delete confirmation is layered on top
      of this overlay. Let it handle Escape
      first instead of closing both at once.
  */

    if (deleteIsOpen) {
      return;
    }

    if (overlay.classList.contains("is-open")) {
      if (event.key === "Escape") {
        closeMemory();
      }

      if (event.key === "ArrowLeft") {
        moveMemory(-1);
      }

      if (event.key === "ArrowRight") {
        moveMemory(1);
      }
    }
  });
}

/* =========================================================
   OPEN MEMORY
========================================================= */

function openMemory(memoryId) {
  const overlay = document.getElementById("memoryOverlay");

  if (!overlay) {
    return;
  }

  const sortedMemories = getSortedMemories();

  currentMemoryIndex = sortedMemories.findIndex((memory) => {
    return memory.id === memoryId;
  });

  if (currentMemoryIndex === -1) {
    return;
  }

  renderMemoryModal();

  overlay.classList.add("is-open");

  overlay.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-open");

  document.getElementById("memoryClose").focus();
}

/* =========================================================
   CLOSE MEMORY
========================================================= */

function closeMemory() {
  const overlay = document.getElementById("memoryOverlay");

  if (!overlay) {
    return;
  }

  overlay.classList.remove("is-open");

  overlay.setAttribute("aria-hidden", "true");

  document.body.classList.remove("modal-open");
}

/* =========================================================
   PREVIOUS / NEXT
========================================================= */

function moveMemory(direction) {
  const sortedMemories = getSortedMemories();

  if (!sortedMemories.length) {
    return;
  }

  const nextIndex = currentMemoryIndex + direction;

  /*
    Do not wrap around.

    The archive should have a real beginning
    and end rather than jumping unexpectedly.
*/

  if (nextIndex < 0 || nextIndex >= sortedMemories.length) {
    return;
  }

  currentMemoryIndex = nextIndex;

  renderMemoryModal();
}

/* =========================================================
   GET SORTED MEMORIES
========================================================= */

function getSortedMemories() {
  return [...memories].sort((a, b) => {
    return new Date(b.memoryDate) - new Date(a.memoryDate);
  });
}

/* =========================================================
   RENDER MEMORY MODAL
========================================================= */

function renderMemoryModal() {
  const sortedMemories = getSortedMemories();

  const memory = sortedMemories[currentMemoryIndex];

  if (!memory) {
    return;
  }

  const container = document.getElementById("memoryModalContent");

  const counter = document.querySelector(".memory-modal-counter");

  const previousButton = document.getElementById("previousMemory");

  const nextButton = document.getElementById("nextMemory");

  container.innerHTML = "";

  /*
    Different memory types receive
    different detail presentations.
*/

  switch (memory.type) {
    case "photo":
      container.innerHTML = createPhotoDetail(memory);

      break;

    case "poem":
      container.innerHTML = createPoemDetail(memory);

      break;

    case "note":
      container.innerHTML = createNoteDetail(memory);

      break;

    case "letter":
      container.innerHTML = createLetterDetail(memory);

      break;

    case "photo-cluster":
      container.innerHTML = createClusterDetail(memory);

      break;

    case "milestone":
      container.innerHTML = createMilestoneDetail(memory);

      break;
  }

  counter.textContent = `${currentMemoryIndex + 1}
         / ${sortedMemories.length}`;

  previousButton.disabled = currentMemoryIndex === 0;

  nextButton.disabled = currentMemoryIndex === sortedMemories.length - 1;
}

/* =========================================================
   PHOTO DETAIL
========================================================= */

function createPhotoDetail(memory) {
  const hasImage = memory.imageData && memory.imageData.length > 0;

  const imageMarkup = hasImage
    ? `
            <img
                src="${memory.imageData[0]}"
                alt="${escapeHTML(memory.title || "Memory photograph")}"
            >
        `
    : `<span>photograph</span>`;

  return `
        <div class="modal-photo-detail">

            <div class="modal-photo-frame">

                <div class="
                    modal-photo-image
                    ${hasImage ? "" : `sample-${memory.color}`}
                ">
                    ${imageMarkup}
                </div>

            </div>


            <div class="modal-memory-meta">

                <p class="modal-memory-type">
                    PHOTOGRAPH
                </p>

                ${memory.title ? `<h2>${escapeHTML(memory.title)}</h2>` : ""}

                ${memory.description
      ? `
                        <p class="modal-description">
                            ${escapeHTML(memory.description)}
                        </p>
                    `
      : ""
    }

                <p class="modal-date">
                    ${formatFullDate(memory.memoryDate)}
                </p>

            </div>

        </div>
    `;
}

/* =========================================================
   POEM DETAIL
========================================================= */

function createPoemDetail(memory) {
  return `
        <article class="modal-literary-detail poem-detail">

            <p class="modal-memory-type">
                A LITTLE POEM
            </p>

            <h2>
                ${escapeHTML(memory.title)}
            </h2>

            <div class="literary-rule"></div>

            <p class="modal-literary-text">
                ${escapeHTML(memory.description)}
            </p>

            <p class="modal-signature">
                — S
            </p>

            <p class="modal-date">
                ${formatFullDate(memory.memoryDate)}
            </p>

        </article>
    `;
}

/* =========================================================
   NOTE DETAIL
========================================================= */

function createNoteDetail(memory) {
  return `
        <article class="modal-note-detail">

            <p class="modal-memory-type">
                SMALL THING
            </p>

            <p class="modal-note-text">
                ${escapeHTML(memory.description)}
            </p>

            <p class="modal-note-mark">
                ♡
            </p>

            <p class="modal-date">
                ${formatFullDate(memory.memoryDate)}
            </p>

        </article>
    `;
}

/* =========================================================
   LETTER DETAIL
========================================================= */

function createLetterDetail(memory) {
  return `
        <article class="modal-literary-detail letter-detail">

            <p class="modal-memory-type">
                A LETTER
            </p>

            <h2>
                ${escapeHTML(memory.title)}
            </h2>

            <div class="literary-rule"></div>

            <p class="modal-literary-text">
                ${escapeHTML(memory.description)}
            </p>

            <p class="modal-signature">
                — S
            </p>

            <p class="modal-date">
                ${formatFullDate(memory.memoryDate)}
            </p>

        </article>
    `;
}

/* =========================================================
   PHOTO CLUSTER DETAIL
========================================================= */

function createClusterDetail(memory) {
  const colors = ["sample-landscape", "sample-green", "sample-flower"];

  const clusterImages = memory.imageData && memory.imageData.length > 0 ? memory.imageData : [];

  const imagesToRender = clusterImages.length > 0 ? clusterImages.slice(0, 3) : colors;

  const imagesMarkup = imagesToRender
    .map((source) => {
      const isRealImage = clusterImages.length > 0;

      return `
                <div class="
                    modal-cluster-image
                    ${isRealImage ? "" : source}
                ">
                    ${isRealImage
          ? `<img src="${source}" alt="Memory photograph">`
          : `<span>photograph</span>`
        }
                </div>
            `;
    })
    .join("");

  return `
        <article class="modal-cluster-detail">

            <p class="modal-memory-type">
                PHOTO CLUSTER
            </p>

            <div class="modal-cluster-images">
                ${imagesMarkup}
            </div>


            <h2>
                ${escapeHTML(memory.title)}
            </h2>

            <p class="modal-description">
                ${escapeHTML(memory.description)}
            </p>

            <p class="modal-date">
                ${formatFullDate(memory.memoryDate)}
            </p>

        </article>
    `;
}

/* =========================================================
   MILESTONE DETAIL
========================================================= */

function createMilestoneDetail(memory) {
  return `
        <article class="modal-milestone-detail">

            <div class="modal-milestone-symbol">
                ♡
            </div>

            <p class="modal-memory-type">
                A CHAPTER
            </p>

            <h2>
                ${escapeHTML(memory.title)}
            </h2>

            <p class="modal-description">
                ${escapeHTML(memory.description)}
            </p>

            <p class="modal-date">
                ${formatFullDate(memory.memoryDate)}
            </p>

        </article>
    `;
}

/* =========================================================
   DATE FORMATTER
========================================================= */

function formatFullDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* =========================================================
   HTML SAFETY
========================================================= */

function escapeHTML(value) {
  const element = document.createElement("div");

  element.textContent = value ?? "";

  return element.innerHTML;
}

/* =========================================================
   MEMORY COMPOSER
========================================================= */

function setupComposer() {
  const overlay = document.getElementById("composerOverlay");
  const closeButton = document.getElementById("composerClose");
  const cancelButton = document.getElementById("composerCancel");
  const backdrop = document.querySelector(".composer-backdrop");
  const saveButton = document.getElementById("composerSave");
  const typeButtons = document.querySelectorAll(".memory-type-option");

  if (!overlay) {
    return;
  }

  setDefaultMemoryDateTime();
  renderComposerFields();

  typeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (editingMemoryId !== null) {
        return;
      }

      selectedMemoryType = button.dataset.memoryType;

      typeButtons.forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");
      selectedFiles = [];
      renderComposerFields();
    });
  });

  closeButton.addEventListener("click", closeComposer);
  cancelButton.addEventListener("click", closeComposer);
  backdrop.addEventListener("click", closeComposer);
  saveButton.addEventListener("click", saveComposerMemory);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.classList.contains("is-open")) {
      closeComposer();
    }
  });
}

/* =========================================================
   OPEN COMPOSER
========================================================= */

function openComposer() {
  const overlay = document.getElementById("composerOverlay");

  if (!overlay) {
    return;
  }

  editingMemoryId = null;

  selectedMemoryType = "photo";

  selectedFiles = [];

  document.querySelectorAll(".memory-type-option").forEach((button) => {
    button.disabled = false;
    button.classList.toggle("active", button.dataset.memoryType === "photo");
  });

  setDefaultMemoryDateTime();

  updateComposerHeading();

  renderComposerFields();

  overlay.classList.add("is-open");

  overlay.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-open");
}

function openComposerForEdit(memoryId) {
  const memory = memories.find((item) => {
    return item.id === memoryId;
  });

  if (!memory) {
    return;
  }

  const overlay = document.getElementById("composerOverlay");

  editingMemoryId = memoryId;

  selectedMemoryType = memory.type;

  selectedFiles = [];

  document.querySelectorAll(".memory-type-option").forEach((button) => {
    button.disabled = true;
    button.classList.toggle("active", button.dataset.memoryType === memory.type);
  });

  renderComposerFields();

  fillComposerFromMemory(memory);

  updateComposerHeading();

  overlay.classList.add("is-open");

  overlay.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-open");
}

/* =========================================================
   CLOSE COMPOSER
========================================================= */

function closeComposer() {
  const overlay = document.getElementById("composerOverlay");

  if (!overlay) {
    return;
  }

  overlay.classList.remove("is-open");

  overlay.setAttribute("aria-hidden", "true");

  document.body.classList.remove("modal-open");

  selectedFiles = [];

  editingMemoryId = null;
}

/* =========================================================
   DEFAULT DATE / TIME
========================================================= */

function setDefaultMemoryDateTime() {
  const dateInput = document.getElementById("memoryDate");

  const timeInput = document.getElementById("memoryTime");

  if (!dateInput || !timeInput) {
    return;
  }

  const now = new Date();

  /*
    Local YYYY-MM-DD
*/

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  dateInput.value = `${year}-${month}-${day}`;

  timeInput.value = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
}

/* =========================================================
   COMPOSER HEADING
========================================================= */

function updateComposerHeading() {
  const title = document.getElementById("composerTitle");

  const saveButton = document.querySelector("#composerSave span:first-child");

  if (editingMemoryId !== null) {
    title.textContent = "Edit this memory.";

    if (saveButton) {
      saveButton.textContent = "Save changes";
    }
  } else {
    title.textContent = "Keep a memory.";

    if (saveButton) {
      saveButton.textContent = "Pin to wall";
    }
  }
}

/* =========================================================
   DYNAMIC FORM
========================================================= */

function renderComposerFields(existingMemory = null) {
  const container = document.getElementById("composerDynamicFields");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  switch (selectedMemoryType) {
    case "photo":
      container.innerHTML = createPhotoForm();

      break;

    case "poem":
      container.innerHTML = createPoemForm();

      break;

    case "note":
      container.innerHTML = createNoteForm();

      break;

    case "letter":
      container.innerHTML = createLetterForm();

      break;

    case "photo-cluster":
      container.innerHTML = createPhotoClusterForm();

      break;

    case "milestone":
      container.innerHTML = createMilestoneForm();

      break;
  }

  setupComposerFileInputs();
}

/* =========================================================
   FILL EDIT FORM
========================================================= */

function fillComposerFromMemory(memory) {
  const dateInput = document.getElementById("memoryDate");

  const timeInput = document.getElementById("memoryTime");

  const titleInput = document.getElementById("memoryTitle");

  const descriptionInput = document.getElementById("memoryDescription");

  const date = new Date(memory.memoryDate);

  if (dateInput) {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    dateInput.value = `${year}-${month}-${day}`;
  }

  if (timeInput) {
    timeInput.value = `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes(),
    ).padStart(2, "0")}`;
  }

  if (titleInput) {
    titleInput.value = memory.title || "";
  }

  if (descriptionInput) {
    descriptionInput.value = memory.description || "";
  }

  renderExistingImages(memory);
}

/* =========================================================
   EXISTING IMAGE PREVIEW
========================================================= */

function renderExistingImages(memory) {
  const preview = document.getElementById("filePreview");

  if (!preview) {
    return;
  }

  preview.innerHTML = "";

  if (!memory.imageData || memory.imageData.length === 0) {
    return;
  }

  memory.imageData.forEach((source) => {
    const image = document.createElement("img");

    image.src = source;

    image.alt = "Current memory image";

    preview.appendChild(image);
  });

  const note = document.createElement("small");

  note.className = "existing-image-note";

  note.textContent = "Choose new images below to replace these.";

  preview.appendChild(note);
}

/* =========================================================
   PHOTO FORM
========================================================= */

function createPhotoForm() {
  return `
        <div class="composer-field">

            <span>
                Photograph
            </span>

            <label
                class="upload-dropzone"
                for="memoryFiles"
            >

                <span class="upload-icon">
                    +
                </span>

                <strong>
                    Choose a photograph
                </strong>

                <small>
                    JPG, PNG or WEBP
                </small>

            </label>

            <input
                class="visually-hidden"
                type="file"
                id="memoryFiles"
                accept="image/*"
            >

            <div
                class="file-preview"
                id="filePreview"
            ></div>

        </div>


        <div class="composer-field-grid">

            <label class="composer-field">

                <span>
                    Title
                </span>

                <input
                    type="text"
                    id="memoryTitle"
                    maxlength="120"
                    placeholder="Give this memory a name"
                >

            </label>


            <label class="composer-field">

                <span>
                    Caption
                </span>

                <input
                    type="text"
                    id="memoryDescription"
                    maxlength="220"
                    placeholder="A little something about it"
                >

            </label>

        </div>
    `;
}

/* =========================================================
   POEM FORM
========================================================= */

function createPoemForm() {
  return `
        <label class="composer-field">

            <span>
                Title
            </span>

            <input
                type="text"
                id="memoryTitle"
                maxlength="120"
                placeholder="For you"
            >

        </label>


        <label class="composer-field">

            <span>
                Your poem
            </span>

            <textarea
                id="memoryDescription"
                rows="9"
                maxlength="5000"
                placeholder="Write it exactly how you want it remembered..."
            ></textarea>

        </label>
    `;
}

/* =========================================================
   NOTE FORM
========================================================= */

function createNoteForm() {
  return `
        <label class="composer-field">

            <span>
                Your note
            </span>

            <textarea
                id="memoryDescription"
                rows="6"
                maxlength="1200"
                placeholder="Something small you want to keep..."
            ></textarea>

        </label>
    `;
}

/* =========================================================
   LETTER FORM
========================================================= */

function createLetterForm() {
  return `
        <label class="composer-field">

            <span>
                Letter title
            </span>

            <input
                type="text"
                id="memoryTitle"
                maxlength="160"
                placeholder="To the version of us who hasn't arrived yet"
            >

        </label>


        <label class="composer-field">

            <span>
                Letter
            </span>

            <textarea
                id="memoryDescription"
                rows="11"
                maxlength="10000"
                placeholder="Write your letter..."
            ></textarea>

        </label>
    `;
}

/* =========================================================
   PHOTO CLUSTER FORM
========================================================= */

function createPhotoClusterForm() {
  return `
        <div class="composer-field">

            <span>
                Photographs
            </span>

            <label
                class="upload-dropzone"
                for="memoryFiles"
            >

                <span class="upload-icon">
                    +
                </span>

                <strong>
                    Choose your photographs
                </strong>

                <small>
                    Select several images
                </small>

            </label>

            <input
                class="visually-hidden"
                type="file"
                id="memoryFiles"
                accept="image/*"
                multiple
            >

            <div
                class="file-preview"
                id="filePreview"
            ></div>

        </div>


        <label class="composer-field">

            <span>
                Title
            </span>

            <input
                type="text"
                id="memoryTitle"
                maxlength="120"
                placeholder="Three little moments"
            >

        </label>


        <label class="composer-field">

            <span>
                Caption
            </span>

            <input
                type="text"
                id="memoryDescription"
                maxlength="220"
                placeholder="A little collection from the day"
            >

        </label>
    `;
}

/* =========================================================
   MILESTONE FORM
========================================================= */

function createMilestoneForm() {
  return `
        <label class="composer-field">

            <span>
                Chapter title
            </span>

            <input
                type="text"
                id="memoryTitle"
                maxlength="160"
                placeholder="A chapter worth remembering"
            >

        </label>


        <label class="composer-field">

            <span>
                What made this day important?
            </span>

            <textarea
                id="memoryDescription"
                rows="6"
                maxlength="1800"
                placeholder="Write a few words about this chapter..."
            ></textarea>

        </label>
    `;
}

/* =========================================================
   FILE INPUTS
========================================================= */

function setupComposerFileInputs() {
  const fileInput = document.getElementById("memoryFiles");

  if (!fileInput) {
    return;
  }

  fileInput.addEventListener("change", () => {
    selectedFiles = Array.from(fileInput.files);

    renderFilePreview();
  });
}

/* =========================================================
   FILE PREVIEW
========================================================= */

function renderFilePreview() {
  const preview = document.getElementById("filePreview");

  if (!preview) {
    return;
  }

  preview.innerHTML = "";

  selectedFiles.forEach((file) => {
    const image = document.createElement("img");

    image.alt = file.name;

    image.src = URL.createObjectURL(file);

    preview.appendChild(image);
  });

  if (selectedFiles.length > 0) {
    const note = document.createElement("small");

    note.className = "existing-image-note";

    note.textContent =
      editingMemoryId !== null
        ? "These images will replace the current ones."
        : "Ready to pin to the wall.";

    preview.appendChild(note);
  }
}

/* =========================================================
   SAVE MEMORY
========================================================= */

async function saveComposerMemory() {
  const supabase = window.ourPlaceSupabase;

  if (!supabase) {
    alert("Our Place is not connected to Supabase.");
    return;
  }

  const dateInput = document.getElementById("memoryDate");
  const timeInput = document.getElementById("memoryTime");
  const titleElement = document.getElementById("memoryTitle");
  const descriptionElement = document.getElementById("memoryDescription");

  const title = titleElement ? titleElement.value.trim() : "";
  const description = descriptionElement ? descriptionElement.value.trim() : "";

  if (!dateInput || !timeInput || !dateInput.value || !timeInput.value) {
    alert("Please choose the memory date and time.");
    return;
  }

  const memoryDate = `${dateInput.value}T${timeInput.value}:00`;
  const isNewMemory = editingMemoryId === null;

  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user) {
    alert("Your session has expired. Please sign in again.");
    return;
  }

  const textTypes = ["poem", "note", "letter", "milestone"];

  if (textTypes.includes(selectedMemoryType) && !description) {
    alert("Please write something before saving this memory.");
    return;
  }

  /* EDIT EXISTING MEMORY */
  if (!isNewMemory) {
    const memory = memories.find((item) => {
      return item.id === editingMemoryId;
    });

    if (!memory) {
      alert("That memory could not be found.");
      return;
    }

    const isPhotoMemory =
      selectedMemoryType === "photo" ||
      selectedMemoryType === "photo-cluster";

    if (
      selectedMemoryType === "photo-cluster" &&
      selectedFiles.length > 3
    ) {
      alert("Please choose up to 3 photographs.");
      return;
    }

    let replacementImages = null;

    /*
      Only replace images when the user selected
      new files.
  
      No new files = keep current images.
    */

    if (isPhotoMemory && selectedFiles.length > 0) {
      try {
        replacementImages = await replaceMemoryImagesInStorage(
          editingMemoryId,
          selectedFiles
        );
      } catch (error) {
        console.error(
          "Our Place: image replacement failed.",
          error
        );

        alert(
          `Could not replace the images.\n\n${error.message}`
        );

        return;
      }
    }

    const { data, error } = await supabase
      .from("memories")
      .update({
        title,
        description,
        memory_date: memoryDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingMemoryId)
      .select()
      .single();

    if (error) {
      console.error(
        "Our Place: memory update failed.",
        error
      );

      alert(
        `Could not save your changes.\n\n${error.message}`
      );

      return;
    }

    memory.title = data.title || "";
    memory.description = data.description || "";
    memory.memoryDate = data.memory_date;
    memory.updatedAt = data.updated_at;

    if (replacementImages) {
      memory.imageData = replacementImages.urls;
    }

    const editedId = memory.id;

    closeComposer();
    renderWall();

    setTimeout(() => {
      openMemory(editedId);
    }, 100);

    return;
  }

  /* NEW TEXT MEMORY */
  if (textTypes.includes(selectedMemoryType)) {
    const newId = crypto.randomUUID();

    const { data, error } = await supabase
      .from("memories")
      .insert({
        id: newId,
        type: selectedMemoryType,
        title,
        description,
        memory_date: memoryDate,
        created_by: userData.user.id,
        layout: null,
        rotation: null,
      })
      .select()
      .single();

    if (error) {
      console.error("Our Place: memory creation failed.", error);
      alert(`Could not save the memory.\n\n${error.message}`);
      return;
    }

    memories.push({
      id: data.id,
      type: data.type,
      title: data.title || "",
      description: data.description || "",
      memoryDate: data.memory_date,
      uploadDate: data.created_at,
      createdBy: data.created_by,
      updatedAt: data.updated_at,
      layout: data.layout,
      rotation: data.rotation,
      color: getDemoColorForMemory(data.memory_date),
      imageData: [],
    });

    renderWall();
    closeComposer();
    return;
  }

  /* NEW PHOTO / PHOTO CLUSTER */
  if (
    selectedMemoryType === "photo" ||
    selectedMemoryType === "photo-cluster"
  ) {
    if (selectedFiles.length === 0) {
      alert(
        selectedMemoryType === "photo"
          ? "Please choose a photograph."
          : "Please choose at least one photograph."
      );
      return;
    }

    if (
      selectedMemoryType === "photo-cluster" &&
      selectedFiles.length > 3
    ) {
      alert("Please choose up to 3 photographs.");
      return;
    }

    const newId = crypto.randomUUID();

    const { data: memoryData, error: memoryError } = await supabase
      .from("memories")
      .insert({
        id: newId,
        type: selectedMemoryType,
        title,
        description,
        memory_date: memoryDate,
        created_by: userData.user.id,
        layout: null,
        rotation: null,
      })
      .select()
      .single();

    if (memoryError) {
      console.error("Our Place: photo memory creation failed.", memoryError);
      alert(`Could not save the memory.\n\n${memoryError.message}`);
      return;
    }

    try {
      const uploadedImages = await uploadMemoryImagesToStorage(
        newId,
        selectedFiles
      );

      memories.push({
        id: memoryData.id,
        type: memoryData.type,
        title: memoryData.title || "",
        description: memoryData.description || "",
        memoryDate: memoryData.memory_date,
        uploadDate: memoryData.created_at,
        createdBy: memoryData.created_by,
        updatedAt: memoryData.updated_at,
        layout: memoryData.layout,
        rotation: memoryData.rotation,
        color: getDemoColorForMemory(memoryData.memory_date),
        imageData: uploadedImages.urls,
      });

      renderWall();
      closeComposer();
      return;
    } catch (error) {
      console.error("Our Place: image upload failed.", error);

      await supabase
        .from("memories")
        .delete()
        .eq("id", newId);

      alert(`The memory could not be completed.\n\n${error.message}`);
      return;
    }
  }

  alert("This memory type is not available yet.");
}

/* =========================================================
   SUPABASE IMAGE STORAGE
========================================================= */

function getImageFileExtension(file) {
  const extensions = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
  };

  if (extensions[file.type]) {
    return extensions[file.type];
  }

  const parts = file.name.split(".");
  const extension = parts[parts.length - 1];

  return extension
    ? extension.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "img";
}

async function uploadMemoryImagesToStorage(memoryId, files) {
  const supabase = window.ourPlaceSupabase;

  if (!supabase) {
    throw new Error("Supabase is not connected.");
  }

  const storage = supabase.storage.from("memory-images");
  const uploadedPaths = [];

  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];

      if (!file.type || !file.type.startsWith("image/")) {
        throw new Error(`"${file.name}" is not a supported image.`);
      }

      const extension = getImageFileExtension(file);
      const storagePath =
        `${memoryId}/${String(index + 1).padStart(2, "0")}-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await storage.upload(
        storagePath,
        file,
        {
          cacheControl: "31536000",
          contentType: file.type,
          upsert: false,
        }
      );

      if (uploadError) {
        throw uploadError;
      }

      uploadedPaths.push(storagePath);
    }

    const imageRows = uploadedPaths.map((storagePath, index) => ({
      memory_id: memoryId,
      storage_path: storagePath,
      sort_order: index,
      alt_text: `Memory photograph ${index + 1}`,
    }));

    const { error: imageRowError } = await supabase
      .from("memory_images")
      .insert(imageRows);

    if (imageRowError) {
      throw imageRowError;
    }

    const { data: signedData, error: signedError } =
      await storage.createSignedUrls(uploadedPaths, 86400);

    if (signedError) {
      throw signedError;
    }

    const signedUrls = (signedData || []).map(
      (item) => item.signedUrl
    );

    if (signedUrls.length !== uploadedPaths.length) {
      throw new Error("Supabase did not return all image URLs.");
    }

    return {
      paths: uploadedPaths,
      urls: signedUrls,
    };
  } catch (error) {
    if (uploadedPaths.length > 0) {
      const { error: cleanupError } = await storage.remove(uploadedPaths);

      if (cleanupError) {
        console.error(
          "Our Place: Storage cleanup failed.",
          cleanupError
        );
      }
    }

    const { error: rowCleanupError } = await supabase
      .from("memory_images")
      .delete()
      .eq("memory_id", memoryId);

    if (rowCleanupError) {
      console.error(
        "Our Place: image record cleanup failed.",
        rowCleanupError
      );
    }

    throw error;
  }
}

/* =========================================================
   REPLACE EXISTING MEMORY IMAGES
========================================================= */

async function replaceMemoryImagesInStorage(memoryId, files) {
  const supabase = window.ourPlaceSupabase;

  if (!supabase) {
    throw new Error("Supabase is not connected.");
  }

  if (!files || files.length === 0) {
    throw new Error("No replacement images were selected.");
  }

  const storage = supabase.storage.from("memory-images");

  /*
    First, remember the old image records and paths.
  */

  const { data: oldRows, error: oldRowsError } = await supabase
    .from("memory_images")
    .select("id, storage_path, sort_order")
    .eq("memory_id", memoryId)
    .order("sort_order", { ascending: true });

  if (oldRowsError) {
    throw oldRowsError;
  }

  const oldImageRows = oldRows || [];

  const oldRowIds = oldImageRows.map((row) => row.id);

  const oldStoragePaths = oldImageRows.map(
    (row) => row.storage_path
  );

  /*
    Upload the new images first.

    This uses our existing upload system.
  */

  let uploadedImages;

  try {
    uploadedImages = await uploadMemoryImagesToStorage(
      memoryId,
      files
    );
  } catch (error) {
    throw error;
  }

  try {
    /*
      Remove only the OLD database rows.

      The new rows stay untouched.
    */

    if (oldRowIds.length > 0) {
      const { error: deleteRowsError } = await supabase
        .from("memory_images")
        .delete()
        .in("id", oldRowIds);

      if (deleteRowsError) {
        throw deleteRowsError;
      }
    }

    /*
      Remove the OLD files from Storage.

      A Storage cleanup failure should not undo
      the successful replacement in the database.
    */

    if (oldStoragePaths.length > 0) {
      const { error: storageCleanupError } =
        await storage.remove(oldStoragePaths);

      if (storageCleanupError) {
        console.error(
          "Our Place: old image cleanup failed.",
          storageCleanupError
        );
      }
    }

    return uploadedImages;
  } catch (error) {
    /*
      Something failed after the new images were uploaded.

      Remove the new database rows.
    */

    const { error: rollbackRowsError } = await supabase
      .from("memory_images")
      .delete()
      .in("storage_path", uploadedImages.paths);

    if (rollbackRowsError) {
      console.error(
        "Our Place: replacement row rollback failed.",
        rollbackRowsError
      );
    }

    /*
      Remove the newly uploaded files.
    */

    const { error: rollbackStorageError } =
      await storage.remove(uploadedImages.paths);

    if (rollbackStorageError) {
      console.error(
        "Our Place: replacement storage rollback failed.",
        rollbackStorageError
      );
    }

    throw error;
  }
}


/* =========================================================
   FILE → DATA URL
========================================================= */

function filesToDataURLs(files) {
  return Promise.all(
    files.map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          resolve(reader.result);
        };

        reader.onerror = () => {
          reject(reader.error);
        };

        reader.readAsDataURL(file);
      });
    }),
  );
}

/* =========================================================
   DEMO COLOR
========================================================= */

function getDemoColorForMemory(dateString) {
  const colors = ["landscape", "green", "flower", "room"];

  const value = new Date(dateString).getTime();

  return colors[Math.abs(value) % colors.length];
}

/* =========================================================
   MEMORY EDITING
========================================================= */

function setupMemoryEditing() {
  const editButton = document.getElementById("editMemoryButton");

  if (!editButton) {
    return;
  }

  editButton.addEventListener("click", () => {
    const sortedMemories = getSortedMemories();

    const memory = sortedMemories[currentMemoryIndex];

    if (!memory) {
      return;
    }

    closeMemory();

    openComposerForEdit(memory.id);
  });
}

/* =========================================================
   DELETE SYSTEM
========================================================= */

let deletingMemoryId = null;

function setupDeleteSystem() {
  const deleteButton = document.getElementById("deleteMemoryButton");

  const overlay = document.getElementById("deleteOverlay");

  const closeButton = document.getElementById("deleteClose");

  const cancelButton = document.getElementById("deleteCancel");

  const confirmButton = document.getElementById("deleteConfirm");

  const backdrop = document.querySelector(".delete-backdrop");

  if (!deleteButton) {
    return;
  }

  deleteButton.addEventListener("click", openDeleteConfirmation);

  closeButton.addEventListener("click", closeDeleteConfirmation);

  cancelButton.addEventListener("click", closeDeleteConfirmation);

  backdrop.addEventListener("click", closeDeleteConfirmation);

  confirmButton.addEventListener("click", confirmMemoryDeletion);

  const passwordInput = document.getElementById("deletePassword");

  passwordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      confirmMemoryDeletion();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.classList.contains("is-open")) {
      closeDeleteConfirmation();
    }
  });
}

/* =========================================================
   OPEN DELETE CONFIRMATION
========================================================= */

function openDeleteConfirmation() {
  const sortedMemories = getSortedMemories();

  const memory = sortedMemories[currentMemoryIndex];

  if (!memory) {
    return;
  }

  deletingMemoryId = memory.id;

  const overlay = document.getElementById("deleteOverlay");

  const name = document.getElementById("deleteMemoryName");

  const password = document.getElementById("deletePassword");

  const error = document.getElementById("deleteError");

  name.textContent = memory.title || getMemoryTypeName(memory.type);

  password.value = "";

  error.textContent = "";

  overlay.classList.add("is-open");

  overlay.setAttribute("aria-hidden", "false");

  document.body.classList.add("modal-open");

  password.focus();
}

/* =========================================================
   CLOSE DELETE CONFIRMATION
========================================================= */

function closeDeleteConfirmation() {
  const overlay = document.getElementById("deleteOverlay");

  if (!overlay) {
    return;
  }

  overlay.classList.remove("is-open");

  overlay.setAttribute("aria-hidden", "true");

  deletingMemoryId = null;

  /*
    Only remove the body lock if
    no other overlay is open.
*/

  const composer = document.getElementById("composerOverlay");

  const memoryViewer = document.getElementById("memoryOverlay");

  if (!composer.classList.contains("is-open") && !memoryViewer.classList.contains("is-open")) {
    document.body.classList.remove("modal-open");
  }
}

/* =========================================================
   CONFIRM MEMORY DELETION
========================================================= */

async function confirmMemoryDeletion() {
  const password = document.getElementById("deletePassword");

  const error = document.getElementById("deleteError");

  const confirmButton = document.getElementById("deleteConfirm");

  if (password.value !== DEMO_DELETE_ID) {
    error.textContent = "That Delete ID is not correct.";

    password.focus();

    return;
  }

  if (deletingMemoryId === null) {
    return;
  }

  const memoryId = deletingMemoryId;

  const supabase = window.ourPlaceSupabase;

  if (!supabase) {
    error.textContent = "Supabase is not connected.";

    return;
  }

  confirmButton.disabled = true;
  confirmButton.textContent = "Deleting…";
  error.textContent = "";

  try {
    /*
      Get all image paths belonging to this memory
      before deleting the database record.
    */

    const { data: imageRows, error: imageRowsError } =
      await supabase
        .from("memory_images")
        .select("storage_path")
        .eq("memory_id", memoryId);

    if (imageRowsError) {
      throw imageRowsError;
    }

    const imagePaths = (imageRows || [])
      .map((row) => row.storage_path)
      .filter(Boolean);

    /*
      Delete the actual memory row.

      memory_images rows are removed automatically because
      the table uses ON DELETE CASCADE.
    */

    const { error: memoryDeleteError } = await supabase
      .from("memories")
      .delete()
      .eq("id", memoryId);

    if (memoryDeleteError) {
      throw memoryDeleteError;
    }

    /*
      Remove the corresponding files from private Storage.
    */

    let storageCleanupError = null;

    if (imagePaths.length > 0) {
      const storage = supabase.storage.from("memory-images");

      const { error: cleanupError } =
        await storage.remove(imagePaths);

      storageCleanupError = cleanupError;

      if (cleanupError) {
        console.error(
          "Our Place: Storage cleanup failed.",
          cleanupError
        );
      }
    }

    /*
      Remove the memory from the current wall immediately.
    */

    const memoryIndex = memories.findIndex((memory) => {
      return memory.id === memoryId;
    });

    if (memoryIndex !== -1) {
      memories.splice(memoryIndex, 1);
    }

    closeDeleteConfirmation();
    closeMemory();
    renderWall();

    /*
      The database deletion succeeded even if an old Storage
      file could not be cleaned up.
    */

    if (storageCleanupError) {
      console.warn(
        "Our Place: memory deleted, but some old image files may remain in Storage."
      );
    }
  } catch (deleteError) {
    console.error(
      "Our Place: memory deletion failed.",
      deleteError
    );

    error.textContent =
      `Could not delete this memory. ${deleteError.message}`;
  } finally {
    confirmButton.disabled = false;
    confirmButton.textContent = "Delete memory";
  }
}
/* =========================================================
   MEMORY TYPE NAME
========================================================= */

function getMemoryTypeName(type) {
  const names = {
    photo: "Photograph",

    poem: "Poem",

    note: "Note",

    letter: "Letter",

    "photo-cluster": "Photo collection",

    milestone: "Milestone",
  };

  return names[type] || "Memory";
}

/* =========================================================
   ROTATION
========================================================= */

function getStableSeed(value) {
  const text = String(value ?? "");
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function getMemoryLayout(memory) {
  if (
    Number.isInteger(memory.layout) &&
    memory.layout >= 1 &&
    memory.layout <= 5
  ) {
    return memory.layout;
  }

  return (getStableSeed(memory.id) % 5) + 1;
}

function getMemoryRotation(memory) {
  const rotations = [-1.8, 2.5, -2.3, 1.6, -3, 2, -1.4, 3];

  if (typeof memory.rotation === "number") {
    return memory.rotation;
  }

  return rotations[getStableSeed(memory.id) % rotations.length];
}

/* =========================================================
   WALL END
========================================================= */

function createWallEnd(wall) {
  const end = document.createElement("div");

  end.className = "wall-end";

  end.innerHTML = `
        <span class="wall-end-line"></span>

        <span class="wall-end-symbol">
            ♡
        </span>

        <p>
            this is only the beginning
        </p>
    `;

  wall.appendChild(end);
}

/* =========================================================
   MEMORY BUTTON
========================================================= */

function setupMemoryButton() {
  const button = document.getElementById("addMemoryButton");

  if (!button) {
    return;
  }

  button.addEventListener("click", openComposer);
}