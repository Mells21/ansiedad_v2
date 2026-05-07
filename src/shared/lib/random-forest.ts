import randomForestModel from "@/shared/ml/randomForestModel.json";

interface RandomForestTree {
  childrenLeft: number[];
  childrenRight: number[];
  feature: number[];
  threshold: number[];
  value: number[][];
}

interface RandomForestModelPayload {
  classes: number[];
  featureNames: string[];
  trees: RandomForestTree[];
}

interface PredictionFeatureMap {
  ansiedad_score: number;
  notas: number;
  conducta: number;
  padres: number;
  inasistencias: number;
  economia: number;
  sueno: number;
  extra: number;
  estudio: number;
}

interface ProbabilityItem {
  label: string;
  value: number;
}

interface RandomForestPrediction {
  predictedClass: number;
  predictedLabel: string;
  riskLevel: "bajo" | "moderado" | "alto";
  probabilities: ProbabilityItem[];
}

const model = randomForestModel as RandomForestModelPayload;

const CLASS_LABELS: Record<number, string> = {
  0: "Normal",
  1: "Leve",
  2: "Moderada",
  3: "Severa",
  4: "Extrema",
};

const RISK_LEVELS: Record<string, "bajo" | "moderado" | "alto"> = {
  Normal: "bajo",
  Leve: "bajo",
  Moderada: "moderado",
  Severa: "alto",
  Extrema: "alto",
};

function walkTree(tree: RandomForestTree, features: number[]) {
  let nodeIndex = 0;

  while (tree.childrenLeft[nodeIndex] !== tree.childrenRight[nodeIndex]) {
    const featureIndex = tree.feature[nodeIndex];
    const threshold = tree.threshold[nodeIndex];
    nodeIndex = features[featureIndex] <= threshold ? tree.childrenLeft[nodeIndex] : tree.childrenRight[nodeIndex];
  }

  return tree.value[nodeIndex];
}

export function predictAnxietyWithRandomForest(featureMap: PredictionFeatureMap): RandomForestPrediction {
  const orderedFeatures = model.featureNames.map((featureName) => featureMap[featureName as keyof PredictionFeatureMap]);
  const totals = new Array(model.classes.length).fill(0);

  for (const tree of model.trees) {
    const votes = walkTree(tree, orderedFeatures);
    const voteTotal = votes.reduce((sum, value) => sum + value, 0) || 1;

    votes.forEach((value, index) => {
      totals[index] += value / voteTotal;
    });
  }

  const averaged = totals.map((value) => value / model.trees.length);
  let bestIndex = 0;

  for (let index = 1; index < averaged.length; index += 1) {
    if (averaged[index] > averaged[bestIndex]) {
      bestIndex = index;
    }
  }

  const predictedClass = model.classes[bestIndex];
  const predictedLabel = CLASS_LABELS[predictedClass] ?? String(predictedClass);

  return {
    predictedClass,
    predictedLabel,
    riskLevel: RISK_LEVELS[predictedLabel] ?? "bajo",
    probabilities: model.classes.map((label, index) => ({
      label: CLASS_LABELS[label] ?? String(label),
      value: Number(averaged[index].toFixed(4)),
    })),
  };
}
