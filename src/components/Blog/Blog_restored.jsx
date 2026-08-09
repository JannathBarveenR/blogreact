import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import petoLogo from '../../assets/logo_new.png';
import './Blog.css';

const trendingData = {
    "Health & Wellness": {
        title: "Health & Wellness",
        desc: "Essential health tips for your pet.",
        img: "/blog-assets/vacci.jfif",
        storyKey: "signs"
    },
    "Vaccination": {
        title: "Vaccination Guide",
        desc: "Core vaccines every dog needs and when to give them.",
        img: "/blog-assets/hero.jfif",
        storyKey: "vaccinations"
    },
    "Tick Control": {
        title: "Flea & Tick Prevention",
        desc: "Keep your pet safe from common parasites.",
        img: "/blog-assets/dog.jfif",
        storyKey: "prevention"
    },
    "Nutrition": {
        title: "Healthy Nutrition",
        desc: "Best foods and feeding habits for your dog.",
        img: "/blog-assets/birds.jfif",
        storyKey: "foods"
    }
};

const dogsTrendingItems = [
    { cat: 'health', tagLabel: 'HEALTH', title: 'Why Do Dogs Need Vaccinations?', desc: 'Core vaccines every dog needs and when to give them.', img: '/blog-assets/hero.jfif', story: 'vaccinations' },
    { cat: 'health', tagLabel: 'HEALTH', title: 'Why Do Dogs Need Regular Deworming?', desc: 'Schedule and tips to keep your dog worm-free.', img: '/blog-assets/dog.jfif', story: 'deworming' },
    { cat: 'health', tagLabel: 'HEALTH', title: '10 Early Warning Signs Your Dog May Be Sick', desc: 'Notice early warning signs that your dog may be sick.', img: '/blog-assets/vacci.jfif', story: 'signs' },
    { cat: 'health', tagLabel: 'HEALTH', title: 'Why Is Tick and Flea Prevention Important for Dogs?', desc: 'Keep your pet safe from common parasites.', img: '/blog-assets/dog.jfif', story: 'prevention' },
    { cat: 'health', tagLabel: 'HEALTH', title: 'When Should Puppies Get Their First Vaccination?', desc: 'A complete guide to puppy vaccination schedules.', img: '/blog-assets/vacci.jfif', upcoming: true },
    { cat: 'nutrition', tagLabel: 'NUTRITION', title: 'Which Human Foods Can Be Dangerous for Dogs?', desc: 'Learn which common human foods are toxic to dogs.', img: '/blog-assets/birds.jfif', story: 'foods' },
    { cat: 'nutrition', tagLabel: 'NUTRITION', title: 'How Often Should You Feed Your Dog?', desc: 'Best practices and schedules for feeding your dog.', img: '/blog-assets/smallpets.jfif', story: 'feeding' },
    { cat: 'nutrition', tagLabel: 'NUTRITION', title: 'How Much Food Does Your Dog Really Need?', desc: 'Portion control and calorie needs for different breeds.', img: '/blog-assets/birds.jfif', upcoming: true },
    { cat: 'nutrition', tagLabel: 'NUTRITION', title: 'Choosing the Right Food for Your Dog', desc: 'Dry, wet, or raw? Find the best diet for your dog.', img: '/blog-assets/dog.jfif', upcoming: true },
    { cat: 'nutrition', tagLabel: 'NUTRITION', title: 'Healthy Fruits & Vegetables for Dogs', desc: 'Safe and nutritious natural snacks for your pet.', img: '/blog-assets/hero.jfif', upcoming: true },
    { cat: 'training', tagLabel: 'TRAINING', title: 'Why Should You Start Training Your Dog Early?', desc: 'Training isn\'t just about teaching commands.', img: '/blog-assets/dog.jfif', story: 'trainingEarly' },
    { cat: 'training', tagLabel: 'TRAINING', title: 'Why Is Positive Reinforcement the Best Way to Train Your Dog?', desc: 'Dogs learn best when good behavior is rewarded.', img: '/blog-assets/hero.jfif', story: 'trainingPositive' },
    { cat: 'training', tagLabel: 'TRAINING', title: 'How to Teach Your Dog to Sit', desc: '"Sit" is one of the easiest and most useful commands.', img: '/blog-assets/dog.jfif', story: 'trainingSit' },
    { cat: 'training', tagLabel: 'TRAINING', title: 'How to Teach Your Dog to Stay', desc: '"Stay" helps your dog learn patience and self-control.', img: '/blog-assets/vacci.jfif', story: 'trainingStay' },
    { cat: 'training', tagLabel: 'TRAINING', title: 'How to Teach Your Dog to Come When Called', desc: '"Come" can help keep your dog safe in everyday situations.', img: '/blog-assets/dog.jfif', story: 'trainingCome' },
    { cat: 'training', tagLabel: 'TRAINING', title: 'Potty Training Basics', desc: 'Every puppy has accidents while learning.', img: '/blog-assets/hero.jfif', story: 'trainingPotty' },
    { cat: 'behaviour', tagLabel: 'BEHAVIOUR', title: 'Why Do Dogs Bark?', desc: 'Understand the different types of dog vocalizations.', img: '/blog-assets/hero.jfif', upcoming: true },
    { cat: 'behaviour', tagLabel: 'BEHAVIOUR', title: 'Why Do Dogs Wag Their Tail?', desc: 'Decoding your dog\'s body language.', img: '/blog-assets/dog.jfif', upcoming: true },
    { cat: 'behaviour', tagLabel: 'BEHAVIOUR', title: 'Why Do Dogs Lick People?', desc: 'Is it affection, grooming, or something else?', img: '/blog-assets/vacci.jfif', upcoming: true },
    { cat: 'behaviour', tagLabel: 'BEHAVIOUR', title: 'Why Do Dogs Eat Grass?', desc: 'Exploring this common yet puzzling canine habit.', img: '/blog-assets/dog.jfif', upcoming: true },
    { cat: 'behaviour', tagLabel: 'BEHAVIOUR', title: 'Why Do Dogs Dig Holes?', desc: 'Find out why your garden is full of craters.', img: '/blog-assets/hero.jfif', upcoming: true },
    { cat: 'grooming', tagLabel: 'GROOMING', title: 'How Often Should You Bathe Your Dog?', desc: 'Best bathing practices for different coat types.', img: '/blog-assets/vacci.jfif', upcoming: true },
    { cat: 'grooming', tagLabel: 'GROOMING', title: 'Why Regular Brushing Matters', desc: 'Keep your dog\'s coat healthy and tangle-free.', img: '/blog-assets/dog.jfif', upcoming: true },
    { cat: 'grooming', tagLabel: 'GROOMING', title: 'How to Trim Your Dog\'s Nails Safely', desc: 'A step-by-step guide to stress-free nail clipping.', img: '/blog-assets/hero.jfif', upcoming: true },
    { cat: 'grooming', tagLabel: 'GROOMING', title: 'How to Clean Your Dog\'s Ears', desc: 'Prevent ear infections with proper hygiene.', img: '/blog-assets/dog.jfif', upcoming: true },
    { cat: 'grooming', tagLabel: 'GROOMING', title: 'Brushing Your Dog\'s Teeth Made Easy', desc: 'Tips for maintaining your dog\'s dental health.', img: '/blog-assets/vacci.jfif', upcoming: true },
    { cat: 'everyday_care', tagLabel: 'EVERYDAY CARE', title: 'How Often Should You Change Your Dog’s Drinking Water?', desc: 'Hydration tips and water bowl hygiene.', img: '/blog-assets/vacci.jfif', story: 'drinking' },
    { cat: 'everyday_care', tagLabel: 'EVERYDAY CARE', title: 'How Much Exercise Does Your Dog Need Every Day?', desc: 'Keep your dog active, healthy, and happy.', img: '/blog-assets/dog.jfif', story: 'exercise' },
    { cat: 'everyday_care', tagLabel: 'EVERYDAY CARE', title: 'Choosing Safe Toys for Your Dog', desc: 'Find toys that are fun and safe for heavy chewers.', img: '/blog-assets/dog.jfif', upcoming: true },
    { cat: 'everyday_care', tagLabel: 'EVERYDAY CARE', title: 'How Much Sleep Does Your Dog Need?', desc: 'Understand your dog\'s sleeping patterns.', img: '/blog-assets/hero.jfif', upcoming: true },
    { cat: 'everyday_care', tagLabel: 'EVERYDAY CARE', title: 'Summer Care Tips for Dogs', desc: 'Keep your dog cool and safe during hot days.', img: '/blog-assets/vacci.jfif', upcoming: true },
    { cat: 'everyday_care', tagLabel: 'EVERYDAY CARE', title: 'Monsoon Care Tips for Dogs', desc: 'Protect your pet from rain-related illnesses.', img: '/blog-assets/dog.jfif', upcoming: true },

    { cat: 'lifestyle', tagLabel: 'LIFESTYLE', title: 'Creating a Dog-Friendly Home', desc: 'Tips for living harmoniously with your pet indoors.', img: '/blog-assets/hero.jfif', upcoming: true },
    { cat: 'lifestyle', tagLabel: 'LIFESTYLE', title: 'Traveling with Your Pet', desc: 'Essential checklist for road trips with your furry friend.', img: '/blog-assets/dog.jfif', upcoming: true },
    { cat: 'lifestyle', tagLabel: 'LIFESTYLE', title: 'Introducing a New Pet to the Family', desc: 'How to ensure a smooth transition for everyone.', img: '/blog-assets/vacci.jfif', upcoming: true },
    { cat: 'lifestyle', tagLabel: 'LIFESTYLE', title: 'Fresh Bowls and Happy Tails', desc: 'Upcoming lesson on fresh bowls and happy tails.', img: '/blog-assets/hero.jfif', upcoming: true },
    { cat: 'lifestyle', tagLabel: 'LIFESTYLE', title: 'Healthy Paws, Happy Life', desc: 'Upcoming lesson on healthy paws and happy life.', img: '/blog-assets/dog.jfif', upcoming: true },
];

const catsTrendingItems = [
    { cat: 'health', tagLabel: 'HEALTH', title: 'Why Do Cats Need Vaccinations?', desc: 'Essential vaccines for your feline friend.', img: '/blog-assets/hero.jfif', story: 'cats_vaccinations' },
    { cat: 'health', tagLabel: 'HEALTH', title: 'Why Do Cats Need Regular Deworming?', desc: 'Protect your cat from internal parasites.', img: '/blog-assets/dog.jfif', story: 'cats_deworming' },
    { cat: 'health', tagLabel: 'HEALTH', title: '10 Early Warning Signs Your Cat May Be Sick', desc: 'Learn to spot signs of illness in cats early.', img: '/blog-assets/vacci.jfif', story: 'cats_signs' },
    { cat: 'health', tagLabel: 'HEALTH', title: 'Why Is Flea and Tick Prevention Important for Cats?', desc: 'Keep parasites away from your indoor and outdoor cats.', img: '/blog-assets/dog.jfif', story: 'cats_prevention' },
    { cat: 'nutrition', tagLabel: 'NUTRITION', title: 'Which Human Foods Can Be Dangerous for Cats?', desc: 'Common household foods that are toxic to cats.', img: '/blog-assets/birds.jfif', story: 'cats_foods' },
    { cat: 'nutrition', tagLabel: 'NUTRITION', title: 'How Often Should You Feed Your Cat?', desc: 'Finding the right feeding schedule for your cat.', img: '/blog-assets/smallpets.jfif', story: 'cats_feeding' },
    { cat: 'everyday_care', tagLabel: 'EVERYDAY CARE', title: 'Is Your Cat Drinking Enough Water?', desc: 'Tips to encourage your cat to stay hydrated.', img: '/blog-assets/vacci.jfif', story: 'cats_drinking' },
    // Health
    { cat: 'health', tagLabel: 'HEALTH', title: "Understanding Your Cat's Vital Signs", desc: 'Upcoming lesson on vital signs.', img: '/blog-assets/hero.jfif', upcoming: true },

    // Nutrition
    { cat: 'nutrition', tagLabel: 'NUTRITION', title: 'Choosing the Right Food for Kittens, Adults, and Senior Cats', desc: 'Upcoming lesson on cat food.', img: '/blog-assets/dog.jfif', upcoming: true },
    { cat: 'nutrition', tagLabel: 'NUTRITION', title: 'Human Foods That Are Safe and Toxic for Cats', desc: 'Upcoming lesson on safe and toxic human foods.', img: '/blog-assets/vacci.jfif', upcoming: true },

    // Training
    { cat: 'training', tagLabel: 'TRAINING', title: 'Understanding Cat Body Language', desc: 'Upcoming lesson on cat body language.', img: '/blog-assets/hero.jfif', upcoming: true },
    { cat: 'training', tagLabel: 'TRAINING', title: 'Why Cats Scratch and How to Redirect It', desc: 'Upcoming lesson on scratching.', img: '/blog-assets/dog.jfif', upcoming: true },
    { cat: 'training', tagLabel: 'TRAINING', title: 'Litter Training Tips for Kittens', desc: 'Upcoming lesson on litter training.', img: '/blog-assets/vacci.jfif', upcoming: true },
    { cat: 'training', tagLabel: 'TRAINING', title: 'Managing Aggression and Anxiety', desc: 'Upcoming lesson on managing aggression.', img: '/blog-assets/hero.jfif', upcoming: true },
    { cat: 'training', tagLabel: 'TRAINING', title: 'Socializing Cats with People and Other Pets', desc: 'Upcoming lesson on socializing.', img: '/blog-assets/dog.jfif', upcoming: true },

    // Grooming
    { cat: 'grooming', tagLabel: 'GROOMING', title: 'How Often Should You Groom Your Cat?', desc: 'Upcoming lesson on grooming frequency.', img: '/blog-assets/vacci.jfif', upcoming: true },
    { cat: 'grooming', tagLabel: 'GROOMING', title: 'Brushing Different Coat Types', desc: 'Upcoming lesson on brushing.', img: '/blog-assets/hero.jfif', upcoming: true },
    { cat: 'grooming', tagLabel: 'GROOMING', title: 'Safe Nail Trimming Techniques', desc: 'Upcoming lesson on nail trimming.', img: '/blog-assets/dog.jfif', upcoming: true },
    { cat: 'grooming', tagLabel: 'GROOMING', title: 'Exercise and Indoor Play Ideas', desc: 'Upcoming lesson on exercise and play.', img: '/blog-assets/vacci.jfif', upcoming: true },
    { cat: 'grooming', tagLabel: 'GROOMING', title: 'Creating a Cat-Friendly Home Environment', desc: 'Upcoming lesson on home environment.', img: '/blog-assets/hero.jfif', upcoming: true },

    // Behaviour
    { cat: 'behaviour', tagLabel: 'BEHAVIOUR', title: 'Understanding Cat Body Language', desc: 'Upcoming lesson on cat body language.', img: '/blog-assets/dog.jfif', upcoming: true },
    { cat: 'behaviour', tagLabel: 'BEHAVIOUR', title: 'Why Cats Scratch and How to Redirect It', desc: 'Upcoming lesson on scratching.', img: '/blog-assets/vacci.jfif', upcoming: true },
    { cat: 'behaviour', tagLabel: 'BEHAVIOUR', title: 'Managing Aggression and Fear', desc: 'Upcoming lesson on managing aggression and fear.', img: '/blog-assets/hero.jfif', upcoming: true },
    { cat: 'behaviour', tagLabel: 'BEHAVIOUR', title: 'Preventing Separation Anxiety', desc: 'Upcoming lesson on separation anxiety.', img: '/blog-assets/dog.jfif', upcoming: true },
    { cat: 'behaviour', tagLabel: 'BEHAVIOUR', title: 'Introducing Cats to New People and Pets', desc: 'Upcoming lesson on introducing cats.', img: '/blog-assets/vacci.jfif', upcoming: true },

    // Lifestyle
    { cat: 'lifestyle', tagLabel: 'LIFESTYLE', title: 'Creating a Cat-Friendly Home', desc: 'Upcoming lesson on creating a cat-friendly home.', img: '/blog-assets/hero.jfif', upcoming: true },
    { cat: 'lifestyle', tagLabel: 'LIFESTYLE', title: 'Indoor vs. Outdoor Cats: Pros and Cons', desc: 'Upcoming lesson on indoor vs outdoor cats.', img: '/blog-assets/dog.jfif', upcoming: true },
    { cat: 'lifestyle', tagLabel: 'LIFESTYLE', title: 'Daily Exercise and Interactive Play', desc: 'Upcoming lesson on daily exercise.', img: '/blog-assets/vacci.jfif', upcoming: true },
    { cat: 'lifestyle', tagLabel: 'LIFESTYLE', title: 'Mental Enrichment and Puzzle Activities', desc: 'Upcoming lesson on mental enrichment.', img: '/blog-assets/hero.jfif', upcoming: true },
    { cat: 'lifestyle', tagLabel: 'LIFESTYLE', title: 'Traveling Safely with Your Cat', desc: 'Upcoming lesson on traveling safely.', img: '/blog-assets/dog.jfif', upcoming: true },

    // Training
    { cat: 'training', tagLabel: 'TRAINING', title: 'How to Tame a New Pet Bird', desc: 'Upcoming lesson on taming.', img: '/blog-assets/birds.jfif', upcoming: true },
    { cat: 'training', tagLabel: 'TRAINING', title: 'Teaching Your Bird the "Step Up" Command', desc: 'Upcoming lesson on step up.', img: '/blog-assets/smallpets.jfif', upcoming: true },
    { cat: 'training', tagLabel: 'TRAINING', title: 'How to Train Your Bird Using Positive Reinforcement', desc: 'Upcoming lesson on positive reinforcement.', img: '/blog-assets/birds.jfif', upcoming: true },
    { cat: 'training', tagLabel: 'TRAINING', title: 'Teaching Your Bird to Come When Called', desc: 'Upcoming lesson on recall.', img: '/blog-assets/smallpets.jfif', upcoming: true },
    { cat: 'training', tagLabel: 'TRAINING', title: 'How to Build Trust with Your Pet Bird', desc: 'Upcoming lesson on trust.', img: '/blog-assets/birds.jfif', upcoming: true },

    // Everyday Care
    { cat: 'everyday_care', tagLabel: 'EVERYDAY CARE', title: 'Creating a Daily Care Routine', desc: 'Upcoming lesson on daily care routine.', img: '/blog-assets/vacci.jfif', upcoming: true },
    { cat: 'everyday_care', tagLabel: 'EVERYDAY CARE', title: 'Litter Box Setup and Maintenance', desc: 'Upcoming lesson on litter box setup.', img: '/blog-assets/hero.jfif', upcoming: true },
    { cat: 'everyday_care', tagLabel: 'EVERYDAY CARE', title: 'Dental Care for Healthy Teeth and Gums', desc: 'Upcoming lesson on dental care.', img: '/blog-assets/dog.jfif', upcoming: true },
    { cat: 'everyday_care', tagLabel: 'EVERYDAY CARE', title: 'Ear, Eye, and Paw Care Essentials', desc: 'Upcoming lesson on ear, eye, and paw care.', img: '/blog-assets/vacci.jfif', upcoming: true },
    { cat: 'everyday_care', tagLabel: 'EVERYDAY CARE', title: 'Keeping Your Cat Hydrated', desc: 'Upcoming lesson on keeping your cat hydrated.', img: '/blog-assets/hero.jfif', upcoming: true },
];

const birdsTrendingItems = [
    { cat: 'health', tagLabel: 'HEALTH', title: 'Why Do Pet Birds Need Regular Health Check-ups?', desc: 'Preventive care to keep your bird healthy.', img: '/blog-assets/vacci.jfif', upcoming: true },
    { cat: 'nutrition', tagLabel: 'NUTRITION', title: 'What Should You Feed Your Pet Bird Every Day?', desc: 'A balanced diet for optimal bird health.', img: '/blog-assets/birds.jfif', upcoming: true },
    { cat: 'health', tagLabel: 'HEALTH', title: 'Early Signs Your Bird May Be Sick', desc: 'Upcoming lesson on early signs of sickness.', img: '/blog-assets/birds.jfif', upcoming: true },
    { cat: 'health', tagLabel: 'HEALTH', title: 'Common Bird Diseases Every Owner Should Know', desc: 'Upcoming lesson on common bird diseases.', img: '/blog-assets/smallpets.jfif', upcoming: true },
    { cat: 'health', tagLabel: 'HEALTH', title: "Understanding Your Bird's Vital Signs", desc: 'Upcoming lesson on vital signs.', img: '/blog-assets/birds.jfif', upcoming: true },
    { cat: 'health', tagLabel: 'HEALTH', title: 'Basic First Aid for Pet Birds', desc: 'Upcoming lesson on basic first aid.', img: '/blog-assets/smallpets.jfif', upcoming: true },

    // Nutrition
    { cat: 'nutrition', tagLabel: 'NUTRITION', title: 'Choosing the Right Diet for Your Bird Species', desc: 'Upcoming lesson on choosing the right diet.', img: '/blog-assets/birds.jfif', upcoming: true },
    { cat: 'nutrition', tagLabel: 'NUTRITION', title: 'Safe and Toxic Foods for Birds', desc: 'Upcoming lesson on safe and toxic foods.', img: '/blog-assets/smallpets.jfif', upcoming: true },
    { cat: 'nutrition', tagLabel: 'NUTRITION', title: 'Preventing Nutritional Deficiencies', desc: 'Upcoming lesson on preventing nutritional deficiencies.', img: '/blog-assets/birds.jfif', upcoming: true },
    // Removed duplicate line as per original pattern or just keep them all upcoming
    { cat: 'nutrition', tagLabel: 'NUTRITION', title: 'Reading Bird Food Labels', desc: 'Upcoming lesson on reading food labels.', img: '/blog-assets/birds.jfif', upcoming: true },

    // Everyday Care
    { cat: 'everyday_care', tagLabel: 'EVERYDAY CARE', title: 'Setting Up the Ideal Bird Cage', desc: 'Upcoming lesson on setting up the ideal bird cage.', img: '/blog-assets/smallpets.jfif', upcoming: true },
    { cat: 'everyday_care', tagLabel: 'EVERYDAY CARE', title: 'Daily Cage Cleaning and Hygiene', desc: 'Upcoming lesson on cage cleaning.', img: '/blog-assets/birds.jfif', upcoming: true },
    // Removed duplicate
    { cat: 'everyday_care', tagLabel: 'EVERYDAY CARE', title: 'Safe Toys and Environmental Enrichment', desc: 'Upcoming lesson on safe toys.', img: '/blog-assets/birds.jfif', upcoming: true },

    // Behaviour
    // Removed duplicate
    { cat: 'behaviour', tagLabel: 'BEHAVIOUR', title: 'Understanding Bird Body Language', desc: 'Upcoming lesson on bird body language.', img: '/blog-assets/birds.jfif', upcoming: true },
    { cat: 'behaviour', tagLabel: 'BEHAVIOUR', title: 'Why Birds Bite and How to Prevent It', desc: 'Upcoming lesson on why birds bite.', img: '/blog-assets/smallpets.jfif', upcoming: true },
    { cat: 'behaviour', tagLabel: 'BEHAVIOUR', title: 'Managing Excessive Screaming', desc: 'Upcoming lesson on managing excessive screaming.', img: '/blog-assets/birds.jfif', upcoming: true },
    { cat: 'behaviour', tagLabel: 'BEHAVIOUR', title: 'Building Trust and Bonding with Your Bird', desc: 'Upcoming lesson on building trust.', img: '/blog-assets/smallpets.jfif', upcoming: true },
    { cat: 'behaviour', tagLabel: 'BEHAVIOUR', title: 'Understanding Hormonal Behaviour', desc: 'Upcoming lesson on hormonal behaviour.', img: '/blog-assets/birds.jfif', upcoming: true },
    
    // Training
    // Removed duplicate
    { cat: 'training', tagLabel: 'TRAINING', title: 'How to Tame a New Pet Bird', desc: 'Upcoming lesson on taming.', img: '/blog-assets/birds.jfif', upcoming: true },
    { cat: 'training', tagLabel: 'TRAINING', title: 'Teaching Your Bird the "Step Up" Command', desc: 'Upcoming lesson on step up.', img: '/blog-assets/smallpets.jfif', upcoming: true },
    { cat: 'training', tagLabel: 'TRAINING', title: 'How to Train Your Bird Using Positive Reinforcement', desc: 'Upcoming lesson on positive reinforcement.', img: '/blog-assets/birds.jfif', upcoming: true },
    { cat: 'training', tagLabel: 'TRAINING', title: 'Teaching Your Bird to Come When Called', desc: 'Upcoming lesson on recall.', img: '/blog-assets/smallpets.jfif', upcoming: true },
    { cat: 'training', tagLabel: 'TRAINING', title: 'How to Build Trust with Your Pet Bird', desc: 'Upcoming lesson on trust.', img: '/blog-assets/birds.jfif', upcoming: true }
  ];

const reverseStoryIdMap = {
  'DOG-L0001': 'vaccinations',
  'DOG-L0002': 'deworming',
  'DOG-L0003': 'signs',
  'DOG-L0004': 'prevention',
  'DOG-L0005': 'foods',
  'DOG-L0006': 'feeding',
  'DOG-L0013': 'drinking',
  'DOG-L0014': 'exercise',
  'DOG-L0007': 'trainingEarly',
  'DOG-L0008': 'trainingPositive',
  'DOG-L0009': 'trainingSit',
  'DOG-L0010': 'trainingStay',
  'DOG-L0011': 'trainingCome',
  'DOG-L0012': 'trainingPotty',
  'CAT-L0001': 'cats_vaccinations',
  'CAT-L0002': 'cats_deworming',
  'CAT-L0003': 'cats_signs',
  'CAT-L0004': 'cats_prevention',
  'CAT-L0005': 'cats_foods',
  'CAT-L0006': 'cats_feeding',
  'CAT-L0007': 'cats_drinking',
  'BIRD-L0001': 'birds_checkups',
  'BIRD-L0002': 'birds_feeding'
};

const Blog = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [activePage, setActivePage] = useState('home'); // home, dogs, cats, story
    const [activeStoryKey, setActiveStoryKey] = useState(null);
    const [previousPage, setPreviousPage] = useState('home');
    
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTrendingTag, setActiveTrendingTag] = useState('Health & Wellness');
    const [activeDetailCategory, setActiveDetailCategory] = useState(null);
    const [showAuthPopup, setShowAuthPopup] = useState(false);

    // Subscribe section state
    const [subscribeEmail, setSubscribeEmail] = useState('');
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    const handleSubscribe = async () => {
        if (!subscribeEmail) return;
        setIsSubscribing(true);
        
        const url = "https://script.google.com/macros/s/AKfycbxZ952Ttlx74qftwGro1-0E7YYfwt3rN7z1gEpYhx08CLchjeqHJxuuLfHY2fHe2o18/exec";
        
        const dataToSend = {
            action: "subscribe",
            email: subscribeEmail
        };

        try {
            await fetch(url, {
                method: 'POST',
                body: JSON.stringify(dataToSend)
            });
            
            setIsSubscribing(false);
            setIsSubscribed(true);
            setSubscribeEmail('');
        } catch (error) {
            console.error("Error adding subscriber:", error);
            setIsSubscribing(false);
        }
    };

    const handlePetClick = (petType) => {
        openDetailPage(petType);
    };

    const openDetailPage = (page) => {
        setActivePage(page);
        setActiveDetailCategory('all');
    };

    const closeDetailPage = () => {
        setActivePage('home');
        setActiveDetailCategory(null);
    };

    const openStoryPage = (storyKey) => {
        setPreviousPage(activePage);
        const sId = Object.keys(reverseStoryIdMap).find(key => reverseStoryIdMap[key] === storyKey) || '101';
        navigate(`/pet-parent-academy/blogs/${sId}`);
    };

    const closeStoryPage = () => {
        if (id) {
            navigate('/pet-parent-academy');
        } else {
            setActivePage(previousPage);
            setTimeout(() => setActiveStoryKey(null), 400);
        }
    };

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data && event.data.type === "petolife-story-close") {
                if (id) {
                    navigate('/pet-parent-academy');
                } else {
                    closeStoryPage();
                }
            }
        };
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [previousPage, id, navigate]);

    useEffect(() => {
        if (id && reverseStoryIdMap[id]) {
            setActiveStoryKey(reverseStoryIdMap[id]);
            setActivePage('story');
        } else if (!id && activePage === 'story') {
            closeStoryPage();
        }
    }, [id]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value.toLowerCase());
    };

    const resetHome = () => {
        setSearchQuery('');
        setActiveTrendingTag('Deworming');
    };

    const renderDetailPage = (petType) => {
        let title, subtitle;
        if (petType === 'dogs') {
            title = 'Dogs';
            subtitle = 'Everything your dog needs, all in one place.';
        } else if (petType === 'cats') {
            title = 'Cats';
            subtitle = 'Everything your cat needs, all in one place.';
        } else if (petType === 'birds') {
            title = 'Birds';
            subtitle = 'Everything your bird needs, all in one place.';
        }
        const trendingHeading = activeDetailCategory ? `${activeDetailCategory.charAt(0).toUpperCase() + activeDetailCategory.slice(1)} Topics` : 'Trending Topics';
        
        let sourceItems = dogsTrendingItems;
        if (petType === 'cats') sourceItems = catsTrendingItems;
        if (petType === 'birds') sourceItems = birdsTrendingItems;

        const filteredItems = sourceItems.filter(item => {
            let matchesCategory = true;
            let matchesSearch = true;
            if (activeDetailCategory && activeDetailCategory !== 'all') {
                matchesCategory = item.cat === activeDetailCategory;
            }
            if (searchQuery) {
                matchesSearch = item.title.toLowerCase().includes(searchQuery) || item.desc.toLowerCase().includes(searchQuery);
            }
            return matchesCategory && matchesSearch;
        });

        return (
            <div className={`app-page ${activePage === petType ? 'page-active' : ''} ${activePage === 'story' && previousPage === petType ? 'page-exit' : ''}`} id={`page-${petType}`}>
                <div className="app-container">
                    <header className="detail-page-header">
                        <div className="detail-header-top" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <button className="blog-back-btn" onClick={closeDetailPage} aria-label="Go back" style={{ position: 'absolute', left: 0 }}>
                                <i className="fa-solid fa-arrow-left"></i>
                            </button>
                            <div className="detail-header-text" style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <img src={petoLogo} alt="Petolife Logo" style={{height: '68px', objectFit: 'contain'}} />
                                </div>
                                <p className="detail-page-subtitle">{subtitle}</p>
                            </div>
                            <button className="icon-btn" aria-label="Notifications" onClick={() => setShowAuthPopup(true)} style={{ position: 'absolute', right: 0, fontSize: '1.5rem' }}>
                                <i className="fa-regular fa-bell"></i>
                                <span className="notif-dot"></span>
                            </button>
                        </div>
                    </header>
                    <div className="app-scroll-content detail-scroll">
                        <section className="search-section" style={{ padding: '0 20px', margin: '15px 0' }}>
                            <div className="search-bar-wrapper">
                                <i className="fa-solid fa-magnifying-glass search-icon"></i>
                                <input type="text" placeholder="Search topics, e.g. deworming, puppy care, training..." autoComplete="off" value={searchQuery} onChange={handleSearch} />
                            </div>
                        </section>
                        <section className="detail-section">
                            <div className="section-header">
                                <h3>Browse by Category</h3>
                            </div>
                            <div className="detail-categories-grid">
                                {['all', 'health', 'nutrition', 'training', 'behaviour', 'grooming', 'everyday_care', 'lifestyle'].map(cat => (
                                    <div key={cat} 
                                         className={`detail-cat-card ${cat}-cat ${activeDetailCategory === cat ? 'active' : ''}`}
                                         onClick={() => setActiveDetailCategory(cat)}>
                                        <div className={`detail-cat-icon ${cat}-color`}>
                                            {cat === 'all' && <i className="fa-solid fa-layer-group" style={{ color: '#2C3E50' }}></i>}
                                            {cat === 'health' && <i className="fa-solid fa-heart"></i>}
                                            {cat === 'nutrition' && <i className="fa-solid fa-bowl-food"></i>}
                                            {cat === 'training' && <i className="fa-solid fa-graduation-cap"></i>}
                                            {cat === 'behaviour' && <i className="fa-solid fa-brain"></i>}
                                            {cat === 'grooming' && <i className="fa-solid fa-brush"></i>}
                                            {cat === 'everyday_care' && <i className="fa-solid fa-house"></i>}
                                            {cat === 'lifestyle' && <i className="fa-solid fa-leaf"></i>}
                                        </div>
                                        <span>{cat === 'everyday_care' ? 'Everyday Care' : cat === 'lifestyle' ? 'Lifestyle' : cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                        <section className="detail-section">
                            <div className="section-header">
                                <h3>{trendingHeading}</h3>
                            </div>
                            <div className="detail-trending-list">
                                {filteredItems.length > 0 ? filteredItems.map((item, idx) => (
                                    <div key={idx} 
                                         className="detail-trending-item" 
                                         onClick={() => item.story ? openStoryPage(item.story) : null}
                                         style={item.upcoming ? { opacity: 0.7, cursor: 'not-allowed' } : {}}>
                                        <div style={{ position: 'relative' }}>
                                            <img src={item.img} alt={item.title} className="detail-trending-thumb" />
                                        </div>
                                        <div className="detail-trending-info">
                                            <span className={`detail-trending-tag ${item.cat}-tag`}>{item.tagLabel}</span>
                                            <h4>{item.title}</h4>
                                            <p>{item.desc}</p>
                                        </div>
                                        {item.upcoming ? (
                                            <span style={{ fontSize: '10px', backgroundColor: '#1C3333', color: 'white', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Upcoming Lesson</span>
                                        ) : (
                                            <i className="fa-solid fa-chevron-right detail-trending-arrow"></i>
                                        )}
                                    </div>
                                )) : (
                                    <p className="detail-trending-empty">No topics in this category yet — check back soon!</p>
                                )}
                            </div>
                        </section>
                    </div>

                </div>
            </div>
        );
    };

    const featuredData = trendingData[activeTrendingTag];

    return (
        <div className="blog-app-container">
            {showAuthPopup && (
                <div className="auth-popup-overlay" onClick={() => setShowAuthPopup(false)}>
                    <div className="auth-popup-content" onClick={e => e.stopPropagation()}>
                        <button className="auth-popup-close" onClick={() => setShowAuthPopup(false)}>×</button>
                        <h2>Join Pet Parent Academy</h2>
                        <p>Sign in or sign up to get personalized pet care tips and track your learning!</p>
                        <div className="auth-popup-actions">
                            <button className="auth-btn signin" onClick={() => setShowAuthPopup(false)}>Sign In</button>
                            <button className="auth-btn signup" onClick={() => setShowAuthPopup(false)}>Sign Up</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="app-root">
                {/* PAGE 1 – HOME */}
                <div className={`app-page ${activePage === 'home' ? 'page-active' : ''} ${activePage !== 'home' ? 'page-exit' : ''}`} id="page-home" style={{ zIndex: 1, opacity: activePage === 'home' ? 1 : (activePage === 'story' ? 0.6 : 0), pointerEvents: activePage === 'home' ? 'all' : 'none', transform: activePage === 'home' ? 'translateX(0)' : 'translateX(-30%)' }}>
                    <div className="app-container">
                        <header className="app-header">
                            <div className="header-top" style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <div className="app-logo" onClick={resetHome} style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                                    <img src={petoLogo} alt="Petolife Logo" style={{height: '76px', objectFit: 'contain'}} />
                                </div>
                                <button className="icon-btn" aria-label="Notifications" onClick={() => setShowAuthPopup(true)} style={{ position: 'absolute', right: '0', fontSize: '1.5rem' }}>
                                    <i className="fa-regular fa-bell"></i>
                                    <span className="notif-dot"></span>
                                </button>
                            </div>
                        </header>
                        <div className="app-scroll-content">
                            <section className="hero-section">
                                <div className="hero-content">
                                    <div className="hero-text">
                                        <h2 className="greeting">Welcome to</h2>
                                        <h1 className="main-title" style={{fontSize: '28px'}}>Pet Parent Academy</h1>
                                        <p className="hero-desc">
                                            Learn one new thing every day.<br/>
                                            Small lessons. Better care.<br/>
                                            Healthier pets.
                                        </p>
                                    </div>
                                    <div className="hero-image-container">
                                        <div className="hero-image-circle">
                                            <img src="/blog-assets/hero.jfif" alt="Dog and Cat side-by-side" className="hero-img" />
                                        </div>
                                        <div className="outline-item heart"><i className="fa-regular fa-heart"></i></div>
                                        <div className="outline-item paw-badge"><i className="fa-solid fa-paw"></i></div>
                                        <div className="outline-item heart-r"><i className="fa-regular fa-heart"></i></div>
                                    </div>
                                </div>
                            </section>


                            <section className="search-section">
                                <div className="search-bar-wrapper">
                                    <i className="fa-solid fa-magnifying-glass search-icon"></i>
                                    <input type="text" placeholder="Search topics, e.g. deworming, puppy care, training..." autoComplete="off" value={searchQuery} onChange={handleSearch} />
                                    {/* Removed filter icon button as requested */}
                                </div>
                            </section>

                            <section className="browse-pet-section">
                                <div className="section-header">
                                    <h3>Browse by Pet</h3>
                                </div>
                                <div className="pet-cards-slider">
                                    {(!searchQuery || "dogs care & guides for dogs".includes(searchQuery)) && (
                                        <div className="pet-card" onClick={() => handlePetClick('dogs')}>
                                            <div className="pet-card-image">
                                                <img src="/blog-assets/dog.jfif" alt="Dogs" />
                                            </div>
                                            <div className="pet-card-info">
                                                <h4>Dogs</h4>
                                                <p>Care & guides for dogs</p>
                                            </div>
                                        </div>
                                    )}
                                    {(!searchQuery || "cats care & tips for cats".includes(searchQuery)) && (
                                        <div className="pet-card" onClick={() => handlePetClick('cats')}>
                                            <div className="pet-card-image">
                                                <img src="/blog-assets/hero.jfif" alt="Cats" />
                                            </div>
                                            <div className="pet-card-info">
                                                <h4>Cats</h4>
                                                <p>Care & tips for cats</p>
                                            </div>
                                        </div>
                                    )}
                                    {(!searchQuery || "birds bird care essentials".includes(searchQuery)) && (
                                        <div className="pet-card" onClick={() => handlePetClick('birds')}>
                                            <div className="pet-card-image">
                                                <img src="/blog-assets/birds.jfif" alt="Birds" />
                                            </div>
                                            <div className="pet-card-info">
                                                <h4>Birds</h4>
                                                <p>Bird care essentials</p>
                                            </div>
                                        </div>
                                    )}
                                    {(!searchQuery || "small pets little friends, big care".includes(searchQuery)) && (
                                        <div className="pet-card" style={{opacity: 0.7, cursor: 'not-allowed'}}>
                                            <div className="pet-card-image">
                                                <img src="/blog-assets/smallpets.jfif" alt="Small Pets" />
                                                <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                                    <span style={{backgroundColor: '#1C3333', color: 'white', fontSize: '9px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px'}}>Upcoming Lesson</span>
                                                </div>
                                            </div>
                                            <div className="pet-card-info">
                                                <h4>Small Pets</h4>
                                                <p>Little friends, big care</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>



                            <section className="trending-section">
                                <div className="section-header">
                                    <h3>Popular Topics</h3>
                                </div>
                                <div className="trending-tags-container">
                                    {[
                                        {tag: 'Deworming', icon: 'fa-bug'},
                                        {tag: 'Vaccination', icon: 'fa-syringe'},
                                        {tag: 'Tick Control', icon: 'fa-shield-virus'},
                                        {tag: 'Puppy Care', icon: 'fa-dog'}
                                    ].map(t => (
                                        (!searchQuery || t.tag.toLowerCase().includes(searchQuery)) && (
                                            <div key={t.tag} 
                                                 className={`trending-pill tag-${t.tag.split(' ')[0].toLowerCase()} ${activeTrendingTag === t.tag ? 'active' : ''}`}
                                                 onClick={() => setActiveTrendingTag(t.tag)}>
                                                <i className={`fa-solid ${t.icon}`}></i>
                                                <span>{t.tag}</span>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </section>

                            <section className="featured-section">
                                <div className="featured-card" onClick={() => featuredData.storyKey && openStoryPage(featuredData.storyKey)}>
                                    <div className="featured-text-content">
                                        <div className="featured-badge">
                                            <i className="fa-solid fa-star star-icon"></i>
                                            <span>FEATURED</span>
                                        </div>
                                        <h2 className="featured-title">{featuredData.title}</h2>
                                        <p className="featured-desc">{featuredData.desc}</p>
                                        <button className="read-now-btn" onClick={(e) => { e.stopPropagation(); featuredData.storyKey && openStoryPage(featuredDa