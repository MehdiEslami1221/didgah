import data from "./survey.json";
import type { ResponseRow } from "./db";
export function statistics(rows: ResponseRow[]) {
  const questions = data.questions.map((q, i) => {
    const counts = data.options.map(
      (_, v) => rows.filter((r) => r.answers[i] === v).length,
    );
    return {
      ...q,
      counts,
      mean: rows.length
        ? counts.reduce((sum, c, v) => sum + c * v, 0) / rows.length
        : 0,
    };
  });
  const distribution = data.options.map((_, v) =>
    questions.reduce((n, q) => n + q.counts[v], 0),
  );
  const sections = data.shortSections.map((label, i) => ({
    label,
    mean:
      questions.filter((q) => q.section === i).reduce((a, q) => a + q.mean, 0) /
      7,
  }));
  const matrix = data.shortSections.map((_, i) => {
    let index = i * 7;
    return data.shortSections.map((_, j) =>
      i === j ? null : questions[index++].mean,
    );
  });
  return {
    questions,
    distribution,
    sections,
    matrix,
    count: rows.length,
    mean: rows.length
      ? distribution.reduce((sum, c, v) => sum + c * v, 0) / (rows.length * 56)
      : 0,
  };
}
