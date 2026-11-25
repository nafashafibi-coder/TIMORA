
// 1. HUBUNGKAN DENGAN SUPABASE
const SUPABASE_URL = "ISI_PROJECT_URL_KAMU";
const SUPABASE_ANON_KEY = "ISI_ANON_PUBLIC_KEY_KAMU";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// 2. AMBIL ELEMEN HTML
const authPage = document.getElementById("authPage");
const appPage = document.getElementById("appPage");
const authMessage = document.getElementById("authMessage");

// 3. PINDAH FORM LOGIN DAN DAFTAR
document.getElementById("showRegister").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("registerForm").classList.remove("hidden");
  authMessage.textContent = "";
});

// 4. REGISTRASI
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;

  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name }
    }
  });

  if (error) {
    authMessage.textContent = error.message;
    return;
  }

  authMessage.textContent = data.session
    ? "Akun berhasil dibuat. Silakan masuk."
    : "Periksa email untuk mengonfirmasi akunmu.";

  document.getElementById("registerForm").reset();
});

// 5. LOGIN
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const { error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    authMessage.textContent = error.message;
  }
});

// 6. LOGOUT
document.getElementById("logoutButton").addEventListener("click", async () => {
  await db.auth.signOut();
});

// 7. TAMPILKAN HALAMAN SESUAI STATUS LOGIN
db.auth.onAuthStateChange((event, session) => {
  if (session) {
    authPage.classList.add("hidden");
    appPage.classList.remove("hidden");

    const name = session.user.user_metadata.full_name || session.user.email;
    document.getElementById("userName").textContent = name;

    loadAllData();
  } else {
    appPage.classList.add("hidden");
    authPage.classList.remove("hidden");
  }
});

// 8. TAMBAHKAN TUGAS
document.getElementById("taskForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("taskTitle").value.trim();
  const dueDate = document.getElementById("taskDate").value || null;

  const { error } = await db.from("tasks").insert({
    title,
    due_date: dueDate
  });

  if (error) {
    alert(error.message);
    return;
  }

  e.target.reset();
  loadAllData();
});

// 9. TAMBAHKAN JADWAL
document.getElementById("scheduleForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("scheduleTitle").value.trim();
  const startAt = document.getElementById("scheduleDate").value;

  const { error } = await db.from("schedules").insert({
    title,
    start_at: new Date(startAt).toISOString()
  });

  if (error) {
    alert(error.message);
    return;
  }

  e.target.reset();
  loadAllData();
});

// 10. AMBIL DATA TUGAS DAN JADWAL
async function loadAllData() {
  const { data: tasks, error: taskError } = await db
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: schedules, error: scheduleError } = await db
    .from("schedules")
    .select("*")
    .order("start_at", { ascending: true });

  if (taskError || scheduleError) {
    alert("Gagal memuat data. Periksa koneksi dan pengaturan database.");
    return;
  }

  renderTasks(tasks || []);
  renderSchedules(schedules || []);
  updateStats(tasks || []);
}

// 11. TAMPILKAN TUGAS
function renderTasks(tasks) {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  if (tasks.length === 0) {
    list.textContent = "Belum ada tugas. Yuk, tambahkan tugas pertamamu!";
  }

  tasks.forEach(task => {
    const item = document.createElement("div");
    item.className = "item";

    const info = document.createElement("div");
    info.className = "item-info";

    const title = document.createElement("strong");
    title.textContent = task.title;
    if (task.completed) title.classList.add("done");

    const date = document.createElement("small");
    date.textContent = task.due_date
      ? "Deadline: " + task.due_date
      : "Tidak ada deadline";

    info.append(title, date);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const doneButton = document.createElement("button");
    doneButton.textContent = task.completed ? "Batalkan" : "Selesai";
    doneButton.addEventListener("click", () => toggleTask(task));

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Hapus";
    deleteButton.className = "delete";
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    actions.append(doneButton, deleteButton);
    item.append(info, actions);
    list.appendChild(item);
  });
}

// 12. TANDAI TUGAS SELESAI
async function toggleTask(task) {
  const { error } = await db
    .from("tasks")
    .update({ completed: !task.completed })
    .eq("id", task.id);

  if (error) {
    alert(error.message);
    return;
  }

  loadAllData();
}

// 13. HAPUS TUGAS
async function deleteTask(id) {
  if (!confirm("Yakin ingin menghapus tugas ini?")) return;

  const { error } = await db
    .from("tasks")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  loadAllData();
}

// 14. TAMPILKAN JADWAL
function renderSchedules(schedules) {
  const list = document.getElementById("scheduleList");
  list.innerHTML = "";

  if (schedules.length === 0) {
    list.textContent = "Belum ada jadwal kegiatan.";
  }

  schedules.forEach(schedule => {
    const item = document.createElement("div");
    item.className = "item";

    const info = document.createElement("div");
    info.className = "item-info";

    const title = document.createElement("strong");
    title.textContent = schedule.title;

    const date = document.createElement("small");
    date.textContent = new Date(schedule.start_at).toLocaleString("id-ID");

    info.append(title, date);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Hapus";
    deleteButton.className = "delete";
    deleteButton.addEventListener("click", () => deleteSchedule(schedule.id));

    const actions = document.createElement("div");
    actions.className = "item-actions";
    actions.appendChild(deleteButton);

    item.append(info, actions);
    list.appendChild(item);
  });
}

// 15. HAPUS JADWAL
async function deleteSchedule(id) {
  if (!confirm("Yakin ingin menghapus jadwal ini?")) return;

  const { error } = await db
    .from("schedules")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  loadAllData();
}

// 16. HITUNG RINGKASAN TUGAS
function updateStats(tasks) {
  const completed = tasks.filter(task => task.completed).length;
  const pending = tasks.length - completed;

  document.getElementById("totalTasks").textContent = tasks.length;
  document.getElementById("completedTasks").textContent = completed;
  document.getElementById("pendingTasks").textContent = pending;
}
