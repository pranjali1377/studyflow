# StudyFlow 📚

**A simple and organized student productivity planner.**

StudyFlow is a web-based student planner designed to help students organize their academic tasks, manage their daily workload and keep track of their progress.

🔗 **Live Website:** https://studyflow-6e7df.web.app

## ✨ Features

- **Task Management:** Create and manage academic tasks.
- **Task Prioritization:** Organize tasks using categories and priority levels.
- **Daily Task Tracking:** Focus on tasks scheduled for the current day.
- **Task History:** View previously archived tasks, including completed and incomplete tasks.
- **Automatic Task Archiving:** Previous days' tasks are automatically moved into history.
- **User Authentication:** Create an account and securely access your personal workspace.
- **Cloud Storage:** Store tasks using Firebase Cloud Firestore.
- **Persistent Data:** Access saved tasks even after refreshing the website.

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Website structure |
| CSS3 | Styling and responsive design |
| JavaScript | Application logic and functionality |
| Firebase Authentication | User authentication |
| Cloud Firestore | Database and task storage |
| Firebase Hosting | Website deployment |
| Git & GitHub | Version control and source code management |

## ⚙️ How It Works

1. Users create an account or log in.
2. They add and organize their academic tasks.
3. Tasks are saved to Firebase Firestore.
4. Tasks from previous dates are automatically archived.
5. Users can access their previous tasks through Task History.

## 🚀 Getting Started

To run StudyFlow locally:

1. Clone the repository:

   ```bash
   git clone https://github.com/pranjali1377/studyflow.git
   ```

2. Open the project folder in VS Code.

3. Configure Firebase using your own Firebase project configuration.

4. Open `index.html` using a local development server.

## 🔐 Security

StudyFlow uses Firebase Authentication and Cloud Firestore.

Firestore Security Rules should ensure that authenticated users can access only their own data.

## 🌱 Future Improvements

- Improve the dashboard and progress analytics.
- Add more productivity features.
- Improve the user experience across devices.
- Introduce additional study-planning tools.

## 👩‍💻 Author

**Pranjali More**

GitHub: [@pranjali1377](https://github.com/pranjali1377)

---

*Built as a student project to make academic planning more organized and manageable.*