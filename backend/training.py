import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import os

print("Generating 10,000 Hybrid AI candidate-job pairs...")
np.random.seed(42)
n_samples = 10000

tfidf_sim = np.random.beta(a=2, b=5, size=n_samples)

semantic_sim = np.random.beta(a=6, b=2, size=n_samples)

yoe = np.random.poisson(lam=4.0, size=n_samples)
yoe = np.clip(yoe, 0, 20).astype(int)

num_companies = np.random.poisson(lam=3.0, size=n_samples)
num_companies = np.clip(num_companies, 1, 10).astype(int)

num_educations = np.random.choice(
    [0, 1, 2, 3], p=[0.05, 0.60, 0.30, 0.05], size=n_samples
)

num_skills = np.random.poisson(lam=8.0, size=n_samples)
num_skills = np.clip(num_skills, 0, 30).astype(int)

target = []
for i in range(n_samples):
    if num_educations[i] == 0 and yoe[i] < 2:
        target.append(np.random.choice([1, 0], p=[0.01, 0.99]))
        continue
    if yoe[i] > 0 and (num_companies[i] / max(1, yoe[i])) > 1.5:
        target.append(np.random.choice([1, 0], p=[0.05, 0.95]))
        continue
    if (
        semantic_sim[i] > 0.70
        and (tfidf_sim[i] > 0.15 or num_skills[i] >= 5)
        and yoe[i] >= 1
    ):
        target.append(np.random.choice([1, 0], p=[0.92, 0.08]))
    elif semantic_sim[i] > 0.85:
        target.append(np.random.choice([1, 0], p=[0.85, 0.15]))
    else:
        target.append(np.random.choice([1, 0], p=[0.10, 0.90]))

df = pd.DataFrame(
    {
        "tfidf_sim": tfidf_sim,
        "semantic_sim": semantic_sim,
        "yoe": yoe,
        "num_companies": num_companies,
        "num_educations": num_educations,
        "num_skills": num_skills,
        "target": target,
    }
)

X = df.drop("target", axis=1)
y = df["target"]
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestClassifier(
    n_estimators=100, max_depth=7, random_state=42, class_weight="balanced"
)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

print("\n--- Model Evaluation on Test Set ---")
report_str = classification_report(y_test, y_pred)
print(report_str)

output_dir = os.path.join(os.path.dirname(__file__), "..", "docs", "ml_outputs")
os.makedirs(output_dir, exist_ok=True)
print(f"\nSaving outputs to: {output_dir}")

report_path = os.path.join(output_dir, "classification_report.txt")
with open(report_path, "w") as f:
    f.write("Classification Report for RandomForest Bouncer\n")
    f.write("=" * 60 + "\n\n")
    f.write(report_str)
print("  classification_report.txt")

cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(6, 5))
sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=["Not Shortlisted (0)", "Shortlisted (1)"],
    yticklabels=["Not Shortlisted (0)", "Shortlisted (1)"],
)
plt.title("Confusion Matrix - RandomForest Bouncer")
plt.ylabel("True Label")
plt.xlabel("Predicted Label")
plt.tight_layout()
cm_path = os.path.join(output_dir, "confusion_matrix.png")
plt.savefig(cm_path, dpi=150)
plt.close()
print("  confusion_matrix.png")

importances = model.feature_importances_
feature_names = X.columns.tolist()
sorted_idx = np.argsort(importances)[::-1]

plt.figure(figsize=(8, 5))
plt.bar(range(len(importances)), importances[sorted_idx], align="center")
plt.xticks(
    range(len(importances)),
    [feature_names[i] for i in sorted_idx],
    rotation=45,
    ha="right",
)
plt.title("Global Feature Importance - RandomForest Bouncer")
plt.ylabel("Importance")
plt.xlabel("Feature")
plt.tight_layout()
fi_path = os.path.join(output_dir, "feature_importance.png")
plt.savefig(fi_path, dpi=150)
plt.close()
print("  feature_importance.png")

joblib.dump(model, "ml_bouncer_model.pkl")
print(f"\nModel saved to: {os.path.abspath('ml_bouncer_model.pkl')}")
