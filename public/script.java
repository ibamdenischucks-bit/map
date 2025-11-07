// Shared logic

function initSignup() {
  let users = JSON.parse(localStorage.getItem("users_v2")) || [];
  let paidUsers = users.filter(u => u.paid === true);

  if (paidUsers.length === 0) {
    document.getElementById("signupForm").style.display = "block";
    return;
  }

  let shuffled = paidUsers.sort(() => 0.5 - Math.random());
  let batch = shuffled.slice(0, 10);

  let container = document.getElementById("paidListRequirement");
  container.innerHTML = "<h3>Click all Paid Accounts before continuing:</h3>";
  batch.forEach(u => {
    let btn = document.createElement("button");
    btn.textContent = u.name;
    btn.style.background = "#ccc";
    btn.onclick = () => {
      btn.style.background = "blue";
      btn.disabled = true;
      btn.dataset.clicked = "true";

      if ([...container.querySelectorAll("button")].every(b => b.dataset.clicked)) {
        document.getElementById("signupForm").style.display = "block";
      }
    };
    container.appendChild(btn);
  });

  document.getElementById("signupForm").addEventListener("submit", e => {
    e.preventDefault();

    let reader = new FileReader();
    reader.onload = function(evt) {
      let user = {
        id: Date.now(),
        name: document.getElementById("name").value,
        password: document.getElementById("password").value,
        url: document.getElementById("url").value,
        photo: evt.target.result,
        paid: false
      };

      users.push(user);
      localStorage.setItem("users_v2", JSON.stringify(users));
      localStorage.setItem("loggedInUser", JSON.stringify(user));
      alert("Signup successful!");
      window.location.href = "main.html";
    };
    reader.readAsDataURL(document.getElementById("photo").files[0]);
  });
}

function initLogin() {
  document.getElementById("loginForm").addEventListener("submit", e => {
    e.preventDefault();
    let name = document.getElementById("name").value;
    let pass = document.getElementById("password").value;

    let users = JSON.parse(localStorage.getItem("users_v2")) || [];
    let user = users.find(u => u.name === name && u.password === pass);

    if (!user) {
      alert("Invalid login");
      return;
    }

    localStorage.setItem("loggedInUser", JSON.stringify(user));
    window.location.href = "main.html";
  });
}

function initPayment() {
  document.getElementById("paymentForm").addEventListener("submit", e => {
    e.preventDefault();
    let file = document.getElementById("receipt").files[0];
    if (!file) return alert("Upload proof first.");

    let reader = new FileReader();
    reader.onload = function(evt) {
      let proof = evt.target.result;
      let user = JSON.parse(localStorage.getItem("loggedInUser"));
      if (!user) return alert("Login first.");

      let users = JSON.parse(localStorage.getItem("users_v2")) || [];
      users = users.map(u => {
        if (u.id === user.id) {
          u.paid = "pending";
          u.paymentProof = proof;
        }
        return u;
      });

      localStorage.setItem("users_v2", JSON.stringify(users));
      alert("Proof submitted. Wait for admin approval.");
      window.location.href = "main.html";
    };
    reader.readAsDataURL(file);
  });
}

function initAdmin() {
  let users = JSON.parse(localStorage.getItem("users_v2")) || [];
  let paidUsers = users.filter(u => u.paid);

  let container = document.getElementById("paidUsers");
  container.innerHTML = "";

  paidUsers.forEach(u => {
    let div = document.createElement("div");
    div.className = "user-card";
    div.innerHTML = `
      <img src="${u.photo}" width="80"><br>
      <b>${u.name}</b><br>
      Status: ${u.paid === true ? "✅ Approved" : "⏳ Pending"}<br>
      <button onclick="viewProof('${u.id}')">View Proof</button>
      ${u.paid === "pending" ?
        `<button onclick="approveUser('${u.id}')">Approve</button>
         <button onclick="rejectUser('${u.id}')">Reject</button>` : ""}
    `;
    container.appendChild(div);
  });
}

function initMain() {
  let user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  document.getElementById("userName").textContent = user.name;
}

function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "login.html";
}

function viewProof(userId) {
  let users = JSON.parse(localStorage.getItem("users_v2")) || [];
  let u = users.find(x => x.id == userId);
  if (!u || !u.paymentProof) return alert("No proof uploaded");
  document.getElementById("proofImage").src = u.paymentProof;
  document.getElementById("proofModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("proofModal").style.display = "none";
}

function approveUser(userId) {
  let users = JSON.parse(localStorage.getItem("users_v2")) || [];
  users = users.map(u => {
    if (u.id == userId) u.paid = true;
    return u;
  });
  localStorage.setItem("users_v2", JSON.stringify(users));
  initAdmin();
}

function rejectUser(userId) {
  let users = JSON.parse(localStorage.getItem("users_v2")) || [];
  users = users.map(u => {
    if (u.id == userId) {
      u.paid = false;
      delete u.paymentProof;
    }
    return u;
  });
  localStorage.setItem("users_v2", JSON.stringify(users));
  initAdmin();
}
