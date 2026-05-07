from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "modelo_random_forest_ansiedad.pkl"
OUTPUT_PATH = BASE_DIR.parent / "src" / "shared" / "ml" / "randomForestModel.json"


def tree_to_dict(estimator: Any) -> dict[str, Any]:
    tree = estimator.tree_
    values = tree.value[:, 0, :]
    return {
        "childrenLeft": tree.children_left.tolist(),
        "childrenRight": tree.children_right.tolist(),
        "feature": tree.feature.tolist(),
        "threshold": tree.threshold.tolist(),
        "value": values.tolist(),
    }


def main() -> None:
    model = joblib.load(MODEL_PATH)

    payload = {
        "classes": [int(label) for label in model.classes_.tolist()],
        "featureNames": [str(name) for name in model.feature_names_in_.tolist()],
        "trees": [tree_to_dict(estimator) for estimator in model.estimators_],
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=True), encoding="utf-8")
    print(f"Modelo exportado a {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
