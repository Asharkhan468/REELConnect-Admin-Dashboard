import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faChartBar,
 
} from "@fortawesome/free-solid-svg-icons";
import "./QuizAnalytics.css";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const QuizAnalytics = ({ quiz, onBack }) => {
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [quizDetails, setQuizDetails] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Safely get userScores with fallback
  const userScores = quiz?.userScores || {};

  // Prepare data for charts
  // const getScoreDistribution = () => {
  //   const distribution = [
  //     { name: "0-25%", value: 0 },
  //     { name: "26-50%", value: 0 },
  //     { name: "51-75%", value: 0 },
  //     { name: "76-100%", value: 0 },
  //   ];

  //   // Safely handle cases where quiz or userScores might be null/undefined
  //   if (quiz && quiz.userScores) {
  //     Object.values(quiz.userScores).forEach((score) => {
  //       const totalQuestions = quiz?.questions?.length || 1; // Fallback to 1 to avoid division by zero
  //       const percentage = ((score?.score || 0) / totalQuestions) * 100;

  //       if (percentage <= 25) {
  //         distribution[0].value++;
  //       } else if (percentage <= 50) {
  //         distribution[1].value++;
  //       } else if (percentage <= 75) {
  //         distribution[2].value++;
  //       } else {
  //         distribution[3].value++;
  //       }
  //     });
  //   }

  //   return distribution;
  // };

  const getScoreDistribution = () => {
  const distribution = [
    { name: "0-25%", value: 0 },
    { name: "26-50%", value: 0 },
    { name: "51-75%", value: 0 },
    { name: "76-100%", value: 0 },
  ];

  if (quiz?.userScores && Object.keys(quiz.userScores).length > 0) {
    Object.values(quiz.userScores).forEach((score) => {
      const totalQuestions = quiz?.questions?.length || 1;
      const percentage = ((score?.score || 0) / totalQuestions) * 100;

      if (percentage <= 25) {
        distribution[0].value++;
      } else if (percentage <= 50) {
        distribution[1].value++;
      } else if (percentage <= 75) {
        distribution[2].value++;
      } else {
        distribution[3].value++;
      }
    });
  }

  return distribution;
};

  // Calculate safe values for display
  const attemptCount = quiz?.attemptCount || 0;
  const averageScore = quiz?.averageScore || 0;
  const highestScore = quiz?.highestScore || 0;
  const lowestScore = quiz?.lowestScore || 0;
  const quizName = quiz?.name || "Quiz";
  const questionCount = quiz?.questions?.length || 0;

  if (loading) {
    return <div className="loading">Loading quiz analytics...</div>;
  }

  return (
    <div className="quiz-analytics-container">
      <div className="quiz-header">
        <h2>
          Quiz Analytics: {quizName} ({attemptCount} Attempts)
        </h2>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <FontAwesomeIcon icon={faChartBar} /> Overview
        </button>

        <button
          className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <FontAwesomeIcon icon={faUser} /> User Attempts
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="overview-tab">
          <div className="stats-cards">
            <div className="stat-card">
              <h3>Total Attempts</h3>
              <p>{attemptCount}</p>
            </div>
            <div className="stat-card">
              <h3>Average Score</h3>
              <p>{averageScore.toFixed(1)}</p>
            </div>
            <div className="stat-card">
              <h3>Highest Score</h3>
              <p>{highestScore}</p>
            </div>
            <div className="stat-card">
              <h3>Lowest Score</h3>
              <p>{lowestScore}</p>
            </div>
          </div>

          <div className="charts-container">
            <div className="chart">
              <h3>Score Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: "Scores",
                      "0-25%": getScoreDistribution()[0].value,
                      "26-50%": getScoreDistribution()[1].value,
                      "51-75%": getScoreDistribution()[2].value,
                      "76-100%": getScoreDistribution()[3].value,
                    },
                  ]}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="0-25%" fill="#FF4444" />
                  <Bar dataKey="26-50%" fill="#FFBB33" />
                  <Bar dataKey="51-75%" fill="#00C851" />
                  <Bar dataKey="76-100%" fill="#33B5E5" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart">
  <h3>Score Percentage</h3>
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={getScoreDistribution().filter(item => item.value > 0)} // Only show segments with values
        cx="50%"
        cy="50%"
        labelLine={false}
        outerRadius={80}
        fill="#8884d8"
        dataKey="value"
        label={({ name, value }) => `${name}`} // Show actual count instead of percentage
      >
        {getScoreDistribution()
          .filter(item => item.value > 0)
          .map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
      </Pie>
      <Tooltip 
        formatter={(value, name, props) => [
          value,
          `${name}: ${((value / attemptCount) * 100).toFixed(1)}%`
        ]}
      />
    </PieChart>
  </ResponsiveContainer>
</div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="users-tab">
          <h3>User Attempts ({attemptCount})</h3>
          <div className="attempts-table">
            {attemptCount === 0 ? (
              <p className="no-attempts">No user attempts yet</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Attempt Date</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(userScores).map(([userId, scoreData]) => {
                    const user = users.find((u) => u.id === userId) || {};
                    const score = scoreData?.score || 0;
                    const percentage = questionCount > 0 
                      ? ((score / questionCount) * 100).toFixed(1)
                      : 0;

                    return (
                      <tr key={userId}>
                        <td>
                          {user.fullname || user.email || `User (${userId})`}
                        </td>
                        <td>
                          {score} / {questionCount}
                        </td>
                        <td>{percentage}%</td>
                        <td>
                          {scoreData?.submittedAt
                            ? new Date(scoreData.submittedAt).toLocaleDateString(
                                "en-GB"
                              )
                            : "N/A"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizAnalytics;