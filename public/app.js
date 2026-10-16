const menuData = {
  dinner: [
    ["01", "Chleb z ognia", "masło palone, sól wędzona, zakwas", "18 PLN"],
    ["02", "Pstrąg / szczaw", "pstrąg ojcowski, szczaw, młody ziemniak, koper", "64 PLN"],
    ["03", "Kalafior / miso", "kalafior z żaru, białe miso, porzeczka, orzech laskowy", "44 PLN"],
    ["04", "Kaczka / wiśnia", "pierś kaczki, wiśnia, burak, jałowiec", "82 PLN"],
    ["05", "Wołowina / seler", "polędwica, seler z ognia, gorczyca, sos własny", "96 PLN"],
  ],
  dessert: [
    ["01", "Truskawka / maślanka", "truskawki, maślanka, beza, werbena", "38 PLN"],
    ["02", "Czekolada / dym", "gorzka czekolada, śliwka, lody z palonego mleka", "42 PLN"],
    ["03", "Ser / miód", "polski ser zagrodowy, miód gryczany, orzech włoski", "40 PLN"],
  ],
  drinks: [
    ["01", "Ember Spritz", "wermut, rokitnik, wino musujące", "36 PLN"],
    ["02", "Las", "gin, sosna, jabłko, tonik", "39 PLN"],
    ["03", "Bez procentów", "porzeczka, herbata lapsang, cytryna", "26 PLN"],
    ["04", "Wino", "selekcja kieliszkowa zmieniana co tydzień", "od 25 PLN"],
  ],
};

const list = document.querySelector("[data-menu-list]");
const tabs = document.querySelectorAll("[data-tab]");
const form = document.querySelector("[data-booking-form]");
const status = document.querySelector("[data-form-status]");
const toast = document.querySelector("[data-toast]");
const nav = document.querySelector(".header nav");
const toggle = document.querySelector(".menu-toggle");

function renderMenu(name) {
  list.innerHTML = menuData[name].map(([number, title, desc, price]) => `
    <article class="menu-item">
      <span class="menu-item__number">${number}</span>
      <div><h3>${title}</h3><p>${desc}</p></div>
      <span class="menu-item__price">${price}</span>
    </article>`).join("");
}
renderMenu("dinner");

tabs.forEach((tab) => tab.addEventListener("click", () => {
  if (tab.classList.contains("active")) return;
  tabs.forEach((item) => item.classList.remove("active"));
  tab.classList.add("active");
  list.classList.add("switching");
  window.setTimeout(() => {
    renderMenu(tab.dataset.tab);
    list.classList.remove("switching");
  }, 220);
}));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));

toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("locked", open);
});
nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  nav.classList.remove("open");
  document.body.classList.remove("locked");
  toggle.setAttribute("aria-expanded", "false");
}));

const dateInput = document.querySelector("#date");
dateInput.min = new Date().toISOString().split("T")[0];

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button");
  button.disabled = true;
  status.textContent = "Wysyłamy rezerwację...";
  status.className = "form-status";

  try {
    const response = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Nie udało się zapisać rezerwacji.");
    form.reset();
    dateInput.min = new Date().toISOString().split("T")[0];
    status.textContent = `Gotowe. Numer rezerwacji: ${result.reference}`;
    status.classList.add("success");
    showToast("Rezerwacja została zapisana. Potwierdzenie wyślemy e-mailem.");
  } catch (error) {
    status.textContent = error.message;
    status.classList.add("error");
  } finally {
    button.disabled = false;
  }
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 5000);
}

window.addEventListener("scroll", () => {
  const hero = document.querySelector(".hero__image");
  if (scrollY < innerHeight) hero.style.transform = `translateY(${scrollY * 0.12}px)`;
});
