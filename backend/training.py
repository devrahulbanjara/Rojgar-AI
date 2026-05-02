import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os

print("Generating 10,000 Hybrid AI candidate-job pairs...")
np.random.seed(42)
n_samples = 10000

# 1. TF-IDF Similarity (Lexical keyword overlap) [0.0 to 1.0]
tfidf_sim = np.random.beta(a=2, b=5, size=n_samples) 

# 2. Semantic Embedding Similarity (Gemini Vectors) [0.0 to 1.0]
semantic_sim = np.random.beta(a=6, b=2, size=n_samples) 

# 3. Years of Experience (Explicit integer from profile)
# FIXED: changed 'mean' to 'lam'
yoe = np.random.poisson(lam=4.0, size=n_samples)
yoe = np.clip(yoe, 0, 20).astype(int)

# 4. Number of past work switches (Experiences)
# FIXED: changed 'mean' to 'lam'
num_companies = np.random.poisson(lam=3.0, size=n_samples)
num_companies = np.clip(num_companies, 1, 10).astype(int)

# 5. Number of Educations
num_educations = np.random.choice([0, 1, 2, 3], p=[0.05, 0.60, 0.30, 0.05], size=n_samples)

# 6. Number of Skills/Certificates
# FIXED: changed 'mean' to 'lam'
num_skills = np.random.poisson(lam=8.0, size=n_samples)
num_skills = np.clip(num_skills, 0, 30).astype(int)

# --- THE TEACHER LOGIC (Simulating the LLM) ---
target = []
for i in range(n_samples):
    if num_educations[i] == 0 and yoe[i] < 2:
        target.append(np.random.choice([1, 0], p=[0.01, 0.99]))
        continue
    if yoe[i] > 0 and (num_companies[i] / max(1, yoe[i])) > 1.5:
        target.append(np.random.choice([1, 0], p=[0.05, 0.95]))
        continue
    if semantic_sim[i] > 0.70 and (tfidf_sim[i] > 0.15 or num_skills[i] >= 5) and yoe[i] >= 1:
        target.append(np.random.choice([1, 0], p=[0.92, 0.08]))
    elif semantic_sim[i] > 0.85:
        target.append(np.random.choice([1, 0], p=[0.85, 0.15]))
    else:
        target.append(np.random.choice([1, 0], p=[0.10, 0.90]))

df = pd.DataFrame({
    'tfidf_sim': tfidf_sim, 'semantic_sim': semantic_sim, 'yoe': yoe,
    'num_companies': num_companies, 'num_educations': num_educations,
    'num_skills': num_skills, 'target': target
})

X = df.drop('target', axis=1)
y = df['target']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, max_depth=7, random_state=42, class_weight="balanced")
model.fit(X_train, y_train)

print("\n--- Model Evaluation on Test Set ---")
print(classification_report(y_test, model.predict(X_test)))

# Save the model to current working directory
joblib.dump(model, 'ml_bouncer_model.pkl')
print(f"\nModel saved to: {os.path.abspath('ml_bouncer_model.pkl')}")