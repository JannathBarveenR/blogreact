// constants.js — shared data used by Step2

export const TOTAL_STEPS = 4;

export const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "";

export const PAW_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cellipse cx='50' cy='70' rx='22' ry='16' fill='%23a8d48d' opacity='0.7'/%3E%3Ccircle cx='28' cy='48' r='10' fill='%23a8d48d' opacity='0.7'/%3E%3Ccircle cx='50' cy='40' r='10' fill='%23a8d48d' opacity='0.7'/%3E%3Ccircle cx='72' cy='48' r='10' fill='%23a8d48d' opacity='0.7'/%3E%3C/svg%3E";

export const dogBreeds = [
  "Afghan Hound","Akita","Alaskan Malamute","American Bully","American Staffordshire Terrier",
  "Australian Shepherd","Bakharwal Dog","Banjara Hound","Basset Hound","Beagle","Belgian Malinois",
  "Belgian Shepherd","Bernese Mountain Dog","Bloodhound","Border Collie","Borzoi","Boston Terrier",
  "Boxer","Bullmastiff","Bully Kutta","Cane Corso","Caravan Hound","Cavalier King Charles Spaniel",
  "Chihuahua","Chippiparai","Chow Chow","Cockapoo","Cocker Spaniel","Dachshund","Dalmatian",
  "Doberman","English Bulldog","English Springer Spaniel","French Bulldog",
  "Gaddi Kutta (Himalayan Sheepdog)","German Shepherd","Golden Retriever","Goldendoodle","Great Dane",
  "Greyhound","Himalayan Mastiff","Indian Pariah Dog (Indie)","Indian Spitz","Irish Setter",
  "Jack Russell Terrier","Jonangi","Kaikadi","Kanni","Kombai","Labradoodle","Labrador Retriever",
  "Lhasa Apso","Mahratta Hound","Maltese","Miniature Pinscher","Miniature Poodle","Mudhol Hound",
  "Neapolitan Mastiff","Newfoundland","Pandikona","Pashmi Hound","Pekingese","Pit Bull Terrier",
  "Pointer","Pomeranian","Poodle (Standard)","Pug","Rajapalayam","Ramanadhapuram Mandai",
  "Rampur Hound","Rottweiler","Rough Collie","Saint Bernard","Saluki","Samoyed",
  "Shetland Sheepdog","Shih Tzu","Siberian Husky","Sindh Mastiff","Tangkhul Hui Dog",
  "Tibetan Mastiff","Toy Poodle","Vizsla","Weimaraner","Whippet","Yorkshire Terrier","Other",
];

export const catBreeds = [
  "American Bobtail","American Curl","American Shorthair","Balinese","Bengal","Birman","Bombay",
  "British Longhair","British Shorthair","Burmese","Chartreux","Cornish Rex","Devon Rex",
  "Egyptian Mau","Exotic Shorthair","Havana Brown","Himalayan","Japanese Bobtail","Khao Manee",
  "Korat","LaPerm","Maine Coon","Manx","Munchkin","Norwegian Forest Cat","Ocicat",
  "Oriental Longhair","Oriental Shorthair","Persian","Peterbald","Pixie-Bob","Ragamuffin","Ragdoll",
  "Russian Blue","Savannah","Scottish Fold","Selkirk Rex","Siamese","Siberian","Singapura",
  "Snowshoe","Somali","Sphynx","Thai","Tonkinese","Toyger","Turkish Angora","Turkish Van",
  "York Chocolate","Other",
];

export const birdBreeds = [
  "Alexandrine Parakeet","African Grey Parrot","Australian King Parrot","Blue-and-Gold Macaw",
  "Blue-fronted Amazon","Blue-winged Parakeet","Budgerigar (Budgie)","Canary","Cockatiel",
  "Cockatoo","Crimson Rosella","Derbyan Parakeet","Diamond Dove","Eclectus Parrot",
  "Finch (Bengalese)","Finch (Gouldian)","Finch (Zebra)","Golden-fronted Leafbird",
  "Green Cheek Conure","Hill Myna","Indian Ringneck Parakeet","Indian Silverbill","Java Sparrow",
  "Lorikeet","Lovebird (Fischer's)","Lovebird (Masked)","Lovebird (Peach-faced)",
  "Macaw (Green-winged)","Macaw (Hyacinth)","Moluccan Cockatoo","Monk Parakeet",
  "Mustache Parakeet","Nanday Conure","Orange-winged Amazon","Parrotlet","Plum-headed Parakeet",
  "Princess Parrot","Quaker Parrot","Rainbow Lorikeet","Red-breasted Parakeet",
  "Rose-ringed Parakeet","Rosy-faced Lovebird","Senegal Parrot","Sun Conure",
  "Sulphur-crested Cockatoo","White Cockatiel","White-eyed Conure","Yellow-collared Lovebird",
  "Yellow-headed Amazon","Other",
];

export const rabbitBreeds = [
  "Alaska","American","American Chinchilla","American Fuzzy Lop","American Sable","Angora",
  "Belgian Hare","Beveren","Blanc de Hotot","Britannia Petite","Californian",
  "Champagne d'Argent","Checkered Giant","Chinchilla","Cinnamon","Continental Giant",
  "Crème d'Argent","Dutch","Dwarf Hotot","English Angora","English Lop","English Spot",
  "Flemish Giant","Florida White","French Angora","French Lop","Giant Chinchilla","Harlequin",
  "Havana","Himalayan","Holland Lop","Jersey Wooly","Lionhead","Mini Lop","Mini Rex","Mini Satin",
  "Netherland Dwarf","New Zealand White","Palomino","Polish","Rex","Satin","Silver","Silver Fox",
  "Silver Marten","Tan","Thrianta","Velveteen Lop","Vienna White","White Giant","Other",
];

export const breedData = {
  Dog: dogBreeds,
  Cat: catBreeds,
  Bird: birdBreeds,
  Rabbit: rabbitBreeds,
  Parrot: birdBreeds,
};

export const petTypes = [
  { name: "Dog" },
  { name: "Cat" },
  { name: "Bird" },
  { name: "Rabbit" },
  { name: "Parrot" },
  { name: "Other" },
];
