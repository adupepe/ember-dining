const menus = {
  dinner: [
    ["001","CHARRED LEEK","por / czarne miso / agrest / popiół","48 PLN"],
    ["002","TROUT 52°C","pstrąg / szczaw / ziemniak / dym","68 PLN"],
    ["003","CELERIAC COAL","seler / drożdże / gorczyca / gruszka","52 PLN"],
    ["004","DUCK + CHERRY","kaczka / wiśnia / burak / jałowiec","84 PLN"],
    ["005","BEEF / 900°C","wołowina / cebula / szpik / czosnek","98 PLN"],
  ],
  dessert: [
    ["101","BURNT MILK","palone mleko / śliwka / karmel / sól","39 PLN"],
    ["102","STRAWBERRY ACID","truskawka / maślanka / bez / werbena","41 PLN"],
    ["103","DARK MATTER","czekolada 72% / dym / porzeczka","43 PLN"],
  ],
  drinks: [
    ["201","SMOKE SIGNAL","mezcal / rokitnik / chili / limonka","42 PLN"],
    ["202","FOREST FREQUENCY","gin / sosna / jabłko / tonik","39 PLN"],
    ["203","ZERO PROOF / RED","porzeczka / lapsang / cytryna","28 PLN"],
    ["204","NATURAL WINE","codzienna selekcja kieliszkowa","OD 27 PLN"],
  ],
};

const list = document.querySelector("[data-menu-list]");
const tabs = document.querySelectorAll("[data-tab]");
const form = document.querySelector("[data-booking-form]");
const status = document.querySelector("[data-form-status]");
const toast = document.querySelector("[data-toast]");
const cursor = document.querySelector(".cursor");
const bootCount = document.querySelector("[data-boot-count]");
const dateInput = document.querySelector("#date");
const nav = document.querySelector(".nav nav");
const toggle = document.querySelector(".nav__toggle");

function renderMenu(key) {
  list.innerHTML = menus[key].map(([no,name,desc,price]) => `
    <article class="lab-item">
      <span class="lab-item__no">${no}</span>
      <h3>${name}</h3>
      <p>${desc}</p>
      <span class="lab-item__price">${price}</span>
    </article>`).join("");
}
renderMenu("dinner");

tabs.forEach(tab => tab.addEventListener("click", () => {
  if (tab.classList.contains("active")) return;
  tabs.forEach(item => item.classList.remove("active"));
  tab.classList.add("active");
  list.classList.add("switching");
  setTimeout(() => {
    renderMenu(tab.dataset.tab);
    list.classList.remove("switching");
  }, 220);
}));

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) {
    entry.target.classList.add("visible");
    observer.unobserve(entry.target);
  }
}), { threshold: .12 });
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

let count = 0;
const counter = setInterval(() => {
  count = Math.min(100, count + Math.ceil(Math.random() * 9));
  bootCount.textContent = String(count).padStart(3,"0");
  if (count === 100) clearInterval(counter);
}, 70);

window.addEventListener("pointermove", event => {
  cursor.style.left = `${event.clientX}px`;
  cursor.style.top = `${event.clientY}px`;
});
document.querySelectorAll(".interactive").forEach(el => {
  el.addEventListener("pointerenter", () => cursor.classList.add("on"));
  el.addEventListener("pointerleave", () => cursor.classList.remove("on"));
});

window.addEventListener("scroll", () => {
  document.querySelectorAll("[data-parallax]").forEach(el => {
    el.style.transform = `translateX(${scrollY * Number(el.dataset.parallax)}px)`;
  });
  const temp = document.querySelector("[data-temp]");
  temp.textContent = Math.round(742 + Math.sin(scrollY / 180) * 85);
});

toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.textContent = open ? "CLOSE" : "MENU";
  toggle.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("locked", open);
});
nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  nav.classList.remove("open");
  toggle.textContent = "MENU";
  document.body.classList.remove("locked");
}));

dateInput.min = new Date().toISOString().split("T")[0];
form.addEventListener("submit", async event => {
  event.preventDefault();
  const button = form.querySelector("button");
  button.disabled = true;
  status.textContent = "> TRANSMITTING DATA...";
  status.className = "form-status mono";
  try {
    const response = await fetch("/api/reservations", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "BOOKING FAILED");
    form.reset();
    dateInput.min = new Date().toISOString().split("T")[0];
    status.textContent = `> CONFIRMED / ${result.reference}`;
    status.classList.add("success");
    toast.textContent = `RESERVATION ${result.reference} / SAVED`;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 5000);
  } catch (error) {
    status.textContent = `> ERROR / ${error.message}`;
    status.classList.add("error");
  } finally {
    button.disabled = false;
  }
});
