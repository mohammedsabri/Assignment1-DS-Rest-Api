// Movie API Types
export type Movie = {
  userId: string;        // Partition key (similar to project userId)
  movieId: string;       // Sort key (unique identifier for the movie)
  title: string;         // Movie title
  description: string;   // Movie description, suitable for translation
  genre: string;         // Genre category
  releaseDate: string;   // Date in ISO format
  budget?: number;       // Optional budget field
  popularity: number;    // Popularity score
  voteAverage: number;   // Average rating
  voteCount: number;     // Number of votes
  posterPath: string;    // Image path for movie poster
  backdropPath: string;  // Image path for movie backdrop
  adult: boolean;        // Indicates if the movie is for adults
  video: boolean;        // Indicates if a video is associated
  createdAt: string;     // Timestamp
  updatedAt: string;     // Timestamp
  translations?: Record<string, string>; // Map of language code to translated descriptions
};

// Query parameters for fetching movies
export type MovieQueryParams = {
  userId: string;       // Required partition key
  genre?: string;       // Optional genre filter
  releaseYear?: string; // Optional filter by release year
  minRating?: number;   // Optional filter by rating
};

// Translation request structure
export type TranslationRequest = {
  language: string; // Target language code (e.g., 'fr', 'es', 'de')
};
