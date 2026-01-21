export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationData {
  name: string;
  coords: Coordinates;
}

export enum PhotoStyle {
  REALISTIC = 'Realistic Photo',
  STREET = 'Street Photography',
  PORTRAIT = 'Portrait',
  VINTAGE = 'Vintage/Sepia',
  CINEMATIC = 'Cinematic Shot',
  JOURNALISTIC = 'Photojournalism',
  PAINTING = 'Oil Painting',
}

export interface GenerationRequest {
  location: LocationData;
  date: string;
  time?: string;
  style: PhotoStyle;
}

export interface GeneratedImage {
  imageUrl: string;
  description: string;
  story: string; // New field for engaging educational content
  promptUsed: string;
}