import { Understanding } from './db-types';

export interface Cluster {
  id: number;
  understandings: Understanding[];
  representative_text: string;
  size: number;
  percentage: number;
}

/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Cluster understandings based on embedding similarity
 * Uses threshold of 0.75 for grouping similar understandings
 */
export function clusterUnderstandings(understandings: Understanding[]): Cluster[] {
  const SIMILARITY_THRESHOLD = 0.75;
  
  // Filter out understandings without embeddings
  const validUnderstandings = understandings.filter(u => u.embedding && u.embedding.length > 0);
  
  if (validUnderstandings.length === 0) {
    return [];
  }

  // Initialize each understanding in its own cluster
  const clusters: Understanding[][] = validUnderstandings.map(u => [u]);
  
  // Calculate similarity matrix and merge similar clusters
  for (let i = 0; i < validUnderstandings.length; i++) {
    for (let j = i + 1; j < validUnderstandings.length; j++) {
      const similarity = cosineSimilarity(
        validUnderstandings[i].embedding!,
        validUnderstandings[j].embedding!
      );
      
      if (similarity >= SIMILARITY_THRESHOLD) {
        // Find which clusters these understandings belong to
        let clusterI = -1;
        let clusterJ = -1;
        
        for (let k = 0; k < clusters.length; k++) {
          if (clusters[k].some(u => u.id === validUnderstandings[i].id)) {
            clusterI = k;
          }
          if (clusters[k].some(u => u.id === validUnderstandings[j].id)) {
            clusterJ = k;
          }
        }
        
        // Merge clusters if they're different
        if (clusterI !== clusterJ && clusterI !== -1 && clusterJ !== -1) {
          clusters[clusterI] = [...clusters[clusterI], ...clusters[clusterJ]];
          clusters.splice(clusterJ, 1);
        }
      }
    }
  }
  
  // Sort clusters by size (largest first)
  clusters.sort((a, b) => b.length - a.length);
  
  // Convert to Cluster objects with representative text
  const totalUnderstandings = validUnderstandings.length;
  
  return clusters.map((clusterUnderstandings, index) => {
    // Find representative understanding (one with highest avg similarity to others in cluster)
    let representativeIndex = 0;
    let maxAvgSimilarity = -1;
    
    if (clusterUnderstandings.length > 1) {
      for (let i = 0; i < clusterUnderstandings.length; i++) {
        let totalSimilarity = 0;
        for (let j = 0; j < clusterUnderstandings.length; j++) {
          if (i !== j) {
            totalSimilarity += cosineSimilarity(
              clusterUnderstandings[i].embedding!,
              clusterUnderstandings[j].embedding!
            );
          }
        }
        const avgSimilarity = totalSimilarity / (clusterUnderstandings.length - 1);
        if (avgSimilarity > maxAvgSimilarity) {
          maxAvgSimilarity = avgSimilarity;
          representativeIndex = i;
        }
      }
    }
    
    return {
      id: index + 1,
      understandings: clusterUnderstandings,
      representative_text: clusterUnderstandings[representativeIndex].understanding_text,
      size: clusterUnderstandings.length,
      percentage: (clusterUnderstandings.length / totalUnderstandings) * 100,
    };
  });
}

/**
 * Calculate consensus percentage based on largest cluster
 * Returns percentage of team that agrees (largest cluster size / total)
 */
export function calculateConsensus(clusters: Cluster[]): number {
  if (clusters.length === 0) {
    return 0;
  }
  
  // Largest cluster is already first due to sorting
  const largestCluster = clusters[0];
  return largestCluster.percentage;
}
