const ICONS = {
  paw: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="16" r="3.4"></circle><circle cx="5.5" cy="8.5" r="1.9"></circle><circle cx="12" cy="6" r="1.9"></circle><circle cx="18.5" cy="8.5" r="1.9"></circle></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z"></path><path d="M9 12l2 2 4-4"></path></svg>`,
  bug: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="13" rx="5" ry="6"></ellipse><line x1="12" y1="4" x2="12" y2="7"></line><line x1="4" y1="10" x2="7" y2="11"></line><line x1="20" y1="10" x2="17" y2="11"></line><line x1="4" y1="17" x2="7" y2="15.5"></line><line x1="20" y1="17" x2="17" y2="15.5"></line></svg>`,
  stethoscope: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v6a4 4 0 0 0 8 0V3"></path><path d="M17 10v3a6 6 0 0 1-12 0v-1"></path><circle cx="19" cy="8" r="2"></circle></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"></rect><line x1="3" y1="10" x2="21" y2="10"></line><line x1="8" y1="3" x2="8" y2="7"></line><line x1="16" y1="3" x2="16" y2="7"></line></svg>`,
  syringe: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2l4 4"></path><path d="M17 7l-11 11-3 5 5-3L19 9"></path><path d="M13 6l5 5"></path><path d="M10.5 8.5l5 5"></path></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5 11-11"></path></svg>`,
  clipboard: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"></rect><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"></path><path d="M8 11h8M8 15h5"></path></svg>`,
  pawFilled: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="16" r="3.6"></circle><circle cx="5.2" cy="8.2" r="2"></circle><circle cx="12" cy="5.6" r="2"></circle><circle cx="18.8" cy="8.2" r="2"></circle></svg>`
};

// Small badge shown in the top-left corner of the cover slide only.
function brandLogoHtml() {
  return `<div class="brand-logo"><img src="images/PetparentAcademyLogo.png" alt="PetOlife Pet Parent Academy" style="width: 100px; height: auto; object-fit: contain; display: block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));"></div>`;
}

// Author shown subtly at the bottom of the first ("cover") card of every story.
const AUTHOR = { name: 'Dr. Ram Charan', role: 'Veterinary Consultant' };

const STORIES = {
  trainingPotty: {
    cards: [

      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training6/s_image1.webp', eyebrow: 'PETOLIFE PET PARENT ACADEMY', title: 'Potty Training Basics', body: 'Every puppy has accidents while learning.\nWith patience and a routine, your dog can learn where to go.', author: true },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/s_image10.webp', title: 'Accidents Are Normal', body: 'Young puppies are still learning to control their bladder.\nAccidents are a normal part of growing up.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training6/s_image2.webp', title: 'Take Your Dog Out Regularly', body: 'Take your dog to the same potty spot:\n• After waking up\n• After meals\n• After playtime\n• Before bedtime' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training6/s_image3.webp', title: 'Keep Using the Same Place', body: 'Taking your dog to the same spot helps them understand where they should go.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training6/s_image4.webp', title: 'Celebrate Every Success', body: 'When your dog goes in the right place...\nPraise them immediately.\nPositive reinforcement helps them learn faster.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training6/s_image5.webp', title: 'Never Punish Accidents', body: 'If your dog has an accident...\nClean it calmly and continue training.\nPunishment only creates confusion.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training6/s_image6.webp', title: 'Learning Takes Time', body: 'Every dog learns at a different pace.\nStay consistent, be patient, and celebrate small improvements.' },
      { type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training6/s_image1.webp', title: 'Quick Check \nWhat should you do if your puppy has an accident inside the house?', options: ['Stay calm, clean it, and continue training.', 'Punish your puppy.', 'Stop training.', 'Keep your puppy indoors all day.'], responses: ['Correct! Accidents happen, just clean and stay consistent.', 'Not quite — punishment causes fear.', 'Not quite — training takes time.', 'Not quite — they need to learn to go outside.'] },
      { type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training6/s_image7.webp', title: 'Tell Us About Your Dog\nIs your dog fully potty trained?', options: ['Yes', 'Still Learning', 'Just Started', 'Haven\'t Started Yet'], responses: ['Awesome! Enjoy a clean house.', 'Patience is key — you\'re doing great.', 'You\'ve got this! Stick to a routine.', 'Establishing a routine is a great first step.'] },
      { type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training6/s_image1.webp', title: 'Great Job!', body: 'You just completed\nPotty Training Basics', recoImg: '/blog-assets/dog.jfif', recoTitle: 'Why Do Dogs Bark?', recoRead: '1 min read', recoStory: 'barking', recoBtn: 'Continue Learning →' }
    ]
  },
  trainingCome: {
    cards: [

      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training5/training5(1).webp', eyebrow: 'PETOLIFE PET PARENT ACADEMY', title: 'How to Teach Your Dog to Come When Called', body: '"Come" is more than a command.\nIt can help keep your dog safe in everyday situations.', author: true },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training5/training5(10).webp', title: 'Begin Without Distractions', body: 'Practice indoors or in a quiet place where your dog can focus on you.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training5/training5(2).webp', title: 'Use a Happy Voice', body: 'Say your dog\'s name, then clearly say:\n"Come!"\nYour voice should sound happy and inviting.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training5/training5(3).webp', title: 'Make Coming to You Fun', body: 'When your dog comes to you...\nPraise them warmly and give a reward.\nMake every success feel exciting.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training5/training5(4).webp', title: 'Always End Positively', body: 'Even if your dog took time to come...\nNever scold them after they arrive.\nYou want your dog to always feel happy about coming to you.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training5/training5(5).webp', title: 'Slowly Add Distractions', body: 'Once your dog responds at home...\nPractice in the garden or park while keeping your dog safe on a leash.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training5/training5(6).webp', title: 'A Few Minutes Makes a Difference', body: 'Practice the "Come" command for a few minutes every day.\nRegular practice helps build a reliable habit.' },
      { type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training5/training5(1).webp', title: 'Quick Check \nWhat should you do when your dog comes to you?', options: ['Praise and reward your dog.', 'Ignore your dog.', 'Scold them for taking too long.', 'End the training session immediately.'], responses: ['Correct! Coming to you should always be rewarding.', 'Not quite — they need to know they did a good job.', 'Not quite — scolding will make them avoid coming next time.', 'Not quite — keep the fun going.'] },
      { type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training5/training5(7).webp', title: 'Tell Us About Your Dog\nDoes your dog come to you when called?', options: ['Almost Always', 'Sometimes', 'Rarely', 'We\'re Still Learning'], responses: ['That\'s fantastic! It\'s a great safety skill.', 'Keep practicing with exciting rewards.', 'Try starting with a shorter distance.', 'Every bit of practice helps!'] },
      { type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training5/training5(1).webp', title: 'Great Job!', body: 'You just completed\nHow to Teach Your Dog to Come When Called', recoImg: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training6/s_image1.webp', recoTitle: 'Potty Training Basics', recoRead: '1 min read', recoStory: 'trainingPotty', recoBtn: 'Continue Learning →' }
    ]
  },
  trainingStay: {
    cards: [

      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training4/training4(1).webp', eyebrow: 'PETOLIFE PET PARENT ACADEMY', title: 'How to Teach Your Dog to Stay', body: '"Stay" helps your dog learn patience and self-control.\nIt also helps keep them safe in many everyday situations.', author: true },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training4/training4(10).webp', title: 'Begin with a Sit', body: 'Ask your dog to sit first.\nIt\'s much easier to teach "Stay" after your dog knows "Sit."' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training4/training4(2).webp', title: 'Say "Stay"', body: 'Hold your palm toward your dog and calmly say:\n"Stay."\nTake one small step backward.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training4/training4(3).webp', title: 'Start Small', body: 'If your dog stays for just a few seconds...\nReturn, praise them, and give a reward.\nEvery small success matters.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training4/training4(4).webp', title: 'Add Time, Then Distance', body: 'As your dog improves, slowly increase the time and distance.\nBe patient and go one step at a time.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training4/training4(5).webp', title: 'It\'s Okay to Try Again', body: 'If your dog gets up, don\'t scold them.\nSimply guide them back, smile, and try again.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training4/training4(6).webp', title: 'Practice Everywhere', body: 'Once your dog understands "Stay" at home...\nPractice in the garden or during walks with small distractions.' },
      { type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training4/training4(1).webp', title: 'Quick Check \nIf your dog gets up before you say "Okay," what should you do?', options: ['Calmly guide them back and try again.', 'Scold your dog.', 'End training immediately.', 'Ignore the behavior.'], responses: ['Correct! Patience is key to success.', 'Not quite — scolding causes confusion.', 'Not quite — try one more time and make it easier.', 'Not quite — you want them to know they moved too soon.'] },
      { type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training4/training4(7).webp', title: 'Tell Us About Your Dog\nCan your dog stay in one place for 10 seconds?', options: ['Yes', 'Almost', 'Not Yet', 'Haven\'t Started'], responses: ['Excellent patience!', 'You are almost there.', 'Take it one second at a time.', 'It\'s a fun skill to learn.'] },
      { type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training4/training4(1).webp', title: 'Great Job!', body: 'You just completed\nHow to Teach Your Dog to Stay', recoImg: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training5/training5(1).webp', recoTitle: 'How to Teach Your Dog to Come When Called', recoRead: '1 min read', recoStory: 'trainingCome', recoBtn: 'Continue Learning →' }
    ]
  },
  trainingSit: {
    cards: [

      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training3/training3(1).webp', eyebrow: 'PETOLIFE PET PARENT ACADEMY', title: 'How to Teach Your Dog to Sit', body: '"Sit" is one of the easiest and most useful commands your dog can learn.\nLet\'s start with this simple skill.', author: true },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training3/training3(10).webp', title: 'Start Without Distractions', body: 'Choose a calm place where your dog can focus on you.\nA quiet environment makes learning easier.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training3/training3(2).webp', title: 'Hold a Treat Above the Nose', body: 'Hold a small treat just above your dog\'s nose.\nSlowly move it slightly backward.\nMany dogs naturally sit while following the treat.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training3/training3(3).webp', title: 'Say the Command Clearly', body: 'As your dog\'s bottom touches the ground, calmly say:\n"Sit."\nUse the same word every time.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training3/training3(4).webp', title: 'Reward the Right Moment', body: 'The moment your dog sits...\nPraise them and give the treat.\nQuick rewards help dogs learn faster.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training3/training3(5).webp', title: 'Practice for a Few Minutes', body: 'A few minutes of practice each day is enough.\nShort sessions keep training fun.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training3/training3(6).webp', title: 'Try Different Places', body: 'Once your dog learns at home...\nPractice in the garden, during walks, or at the park.' },
      { type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training3/training3(1).webp', title: 'Quick Check \nWhen should you reward your dog?', options: ['As soon as your dog sits.', 'Five minutes later.', 'At the end of the day.', 'Only after several tries.'], responses: ['Correct! Immediate rewards help them connect the behavior.', 'Not quite — wait too long and they forget why.', 'Not quite — immediate is best.', 'Not quite — reward every success early on.'] },
      { type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training3/training3(7).webp', title: 'Tell Us About Your Dog\nCan your dog already sit on command?', options: ['Yes', 'Still Learning', 'Not Yet', 'Haven\'t Started'], responses: ['Great job! Keep practicing in new places.', 'Keep it up, consistency is key.', 'With a little practice, they will get it!', 'Today is a great day to start!'] },
      { type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training3/training3(1).webp', title: 'Great Job!', body: 'You just completed\nHow to Teach Your Dog to Sit', recoImg: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training4/training4(1).webp', recoTitle: 'How to Teach Your Dog to Stay', recoRead: '1 min read', recoStory: 'trainingStay', recoBtn: 'Continue Learning →' }
    ]
  },
  trainingPositive: {
    cards: [

      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training2/training2(1).webp', eyebrow: 'PETOLIFE PET PARENT ACADEMY', title: 'Why Is Positive Reinforcement the Best Way to Train Your Dog?', body: 'Dogs learn best when good behavior is rewarded.\nTraining should be built on trust, encouragement, and patience.', author: true },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training2/training2(10).webp', title: 'Reward the Good', body: 'Positive reinforcement means rewarding your dog when they do something you want.\nThis helps them understand which behaviors to repeat.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training2/training2(2).webp', title: 'Rewards Aren\'t Just Treats', body: 'A reward can be:\n• A healthy treat\n• Praise\n• A favorite toy\n• A gentle pat\nDogs enjoy different kinds of rewards.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training2/training2(3).webp', title: 'Don\'t Train Through Fear', body: 'Yelling or hitting can make your dog feel scared or confused.\nA calm and patient approach helps your dog learn with confidence.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training2/training2(4).webp', title: 'Reward Right Away', body: 'Reward your dog as soon as they do the right thing.\nThis helps them connect the reward with their behavior.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training2/training2(5).webp', title: 'A Few Minutes Is Enough', body: 'Short training sessions help your dog stay focused and enjoy learning.\nEnd each session on a positive note.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training2/training2(6).webp', title: 'Practice Every Day', body: 'Using the same words, rewards, and routines helps your dog learn faster.\nSmall, regular practice works better than long sessions.' },
      { type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training2/training2(1).webp', title: 'Quick Check \nWhat is the main idea behind positive reinforcement?', options: ['Reward good behavior so your dog wants to repeat it.', 'Punish mistakes immediately.', 'Train only when your dog misbehaves.', 'Ignore good behavior.'], responses: ['Correct! Positive reinforcement builds trust and fast learning.', 'Not quite — punishment causes fear.', 'Not quite — proactive training is better.', 'Not quite — you should celebrate good behavior.'] },
      { type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training2/training2(7).webp', title: 'Tell Us About Your Dog\nHow do you usually reward your dog during training?', options: ['Treats', 'Praise', 'Toys', 'I haven\'t started training yet'], responses: ['Treats are highly motivating!', 'Dogs love knowing they made you happy.', 'Toys are great for active dogs.', 'Try finding what your dog loves most!'] },
      { type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training2/training2(1).webp', title: 'Great Job!', body: 'You just completed\nWhy Is Positive Reinforcement the Best Way to Train Your Dog?', recoImg: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training3/training3(1).webp', recoTitle: 'How to Teach Your Dog to Sit', recoRead: '1 min read', recoStory: 'trainingSit', recoBtn: 'Continue Learning →' }
    ]
  },
  trainingEarly: {
    cards: [

      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training1/training1(1).webp', eyebrow: 'PETOLIFE PET PARENT ACADEMY', title: 'Why Should You Start Training Your Dog Early?', body: 'Training isn\'t just about teaching commands.\nIt\'s about building trust, communication, and a lifelong bond with your dog.', author: true },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training1/training1(10).webp', title: 'Dogs Learn Every Day', body: 'Dogs are always learning from the people around them.\nThe earlier you start, the easier it is to build good habits.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training1/training1(2).webp', title: 'Training Helps You Understand Each Other', body: 'Training teaches your dog what you expect.\nIt also helps you understand your dog\'s behavior better.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training1/training1(3).webp', title: 'Every Small Step Counts', body: 'You don\'t need difficult tricks.\nSimple skills like responding to their name, sitting, and coming when called are a great start.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training1/training1(4).webp', title: 'Learning Should Be Enjoyable', body: 'Short, fun training sessions help dogs stay interested and enjoy learning.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training1/training1(5).webp', title: 'Every Dog Learns at Its Own Pace', body: 'Some dogs learn quickly.\nOthers need more time.\nPatience and consistency make a big difference.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training1/training1(6).webp', title: 'Everyday Moments Are Training Moments', body: 'Walking, feeding, playing, and even greeting your dog are opportunities to teach good habits.' },
      { type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking%20water/dimage9.webp', title: 'Quick Check \nWhy is it helpful to start training your dog early?', options: ['It helps build good habits and better communication.', 'Puppies can\'t learn.', 'Training is only for competitions.', 'Dogs only need training if they misbehave.'], responses: ['Correct! It builds communication and trust.', 'Not quite — puppies are fast learners.', 'Not quite — basic training helps all dogs.', 'Not quite — proactive training prevents bad habits.'] },
      { type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training1/training1(7).webp', title: 'Tell Us About Your Dog\nHave you ever tried training your dog?', options: ['Yes, regularly', 'Sometimes', 'Not yet', 'I don\'t know where to start'], responses: ['Great job keeping up with training!', 'Consistency will make it even better.', 'Now is the perfect time to start.', 'Start with something simple, like sitting.'] },
      { type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking+water/dimage10.webp', title: 'Great Job!', body: 'You just completed\nWhy Should You Start Training Your Dog Early?', recoImg: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/training/training2/training2(1).webp', recoTitle: 'Why Is Positive Reinforcement the Best Way to Train Your Dog?', recoRead: '1 min read', recoStory: 'trainingPositive', recoBtn: 'Continue Learning →' }
    ]
  },

  vaccinations: {
    cards: [

      // Card 1 — Hook
      {
        type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/vaccination/v1.webp',
        eyebrow: 'PETOLIFE PET PARENT ACADEMY',
        title: 'Why Do Dogs Need Vaccinations?',
        body: 'Vaccines are one of the simplest ways to protect your dog from serious diseases.\nLet\u2019s understand why they are so important.',
        author: true
      },

      // Card 2 — What Is a Vaccine?
      {
        type: 'info', icon: 'shield', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/vaccination/v10.webp',
        title: 'What Does a Vaccine Do?',
        body: 'A vaccine teaches your dog\u2019s body how to fight harmful germs.\nIf those germs attack later, your dog\u2019s body is better prepared to protect itself.'
      },

      // Card 3 — Why Puppies Need More
      {
        type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/vaccination/v11.webp',
        title: 'Puppies Need Extra Protection',
        body: 'Puppies are born with an immature immune system.\nThat\u2019s why they need several vaccines during their first few months of life.'
      },

      // Card 4 — Adult Dogs Still Need Vaccines
      {
        type: 'info', icon: 'syringe', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/vaccination/v2.webp',
        title: 'Vaccination Doesn\u2019t Stop After Puppyhood',
        body: 'Many pet parents think vaccines are only for puppies.\nThat\u2019s a common mistake.\nAdult dogs also need booster vaccines to stay protected.'
      },

      // Card 5 — What Can Vaccines Protect Against?
      {
        type: 'info', icon: 'shield', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/vaccination/v3.webp',
        title: 'Vaccines Help Prevent Serious Diseases',
        body: 'Vaccines can help protect dogs from diseases such as:',
        bullets: ['Parvovirus', 'Distemper', 'Rabies'],
        footnote: 'Some of these illnesses can be life-threatening.'
      },

      // Card 6 — Prevention Is Better
      {
        type: 'info', icon: 'stethoscope', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/vaccination/v4.webp',
        title: 'Prevention Is Always Better',
        body: 'Preventing disease is usually easier, safer, and less stressful than treating a sick pet.\nVaccination is an important part of preventive care.'
      },

      // Card 7 — Survey
      {
        type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/vaccination/v8.webp',
        title: ' Quick Check',
        body: 'Why do adult dogs need booster vaccinations?',
        options: [
          ' To maintain protection against diseases.',
          ' To grow faster.',
          ' To improve their appetite.',
          ' To make their fur softer.'
        ],
        responses: [
          'Correct! Booster vaccines help renew your dog\u2019s immunity over time.',
          'Not quite \u2014 vaccines protect against diseases, not growth.',
          'Not quite \u2014 vaccines protect against diseases, not appetite.',
          'Not quite \u2014 vaccines protect against diseases, not coat texture.'
        ]
      },

      // Card 8 — Stay on Schedule
      {
        type: 'info', icon: 'calendar', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/vaccination/v6.webp',
        title: 'Stay on Schedule',
        checks: [
          'Vaccines work best when given on time.',
          'Missing booster doses may reduce your dog\u2019s protection.',
          'Always follow your veterinarian\u2019s vaccination schedule.'
        ]
      },

      // Card 9 — Knowledge Check
      {
        type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/vaccination/v5.webp',
        title: ' Tell Us About Your Dog',
        body: 'Is your dog\u2019s vaccination currently up to date?',
        options: [
          ' Yes, all vaccinations are completed.',
          ' Some vaccinations are pending.',
          ' No, my dog has missed vaccinations.',
          ' I\u2019m not sure.'
        ],
        responses: [
          'Great job! Keeping up with vaccines is one of the best things you can do for your dog.',
          'That\u2019s okay \u2014 schedule a vet visit soon to get those completed.',
          'Don\u2019t worry \u2014 it\u2019s never too late to start. Book a vet appointment today.',
          'Check with your vet to confirm which vaccines your dog needs and when.'

        ]
      },

      // Card 10 — Remember
      {
        type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/vaccination/vwebp9.webp',
        title: ' Remember',
        body: 'Keeping your dog\u2019s vaccinations up to date is one of the easiest ways to help them stay healthy for years to come.'
      },

      // Card 11 — Great Job + Recommendation
      {
        type: 'summary', img: 'images/CARD 11 — Continue Learning.png',
        title: ' Great Job!',
        body: 'You just completed \u201CWhy Do Dogs Need Vaccinations?\u201D',
        recoImg: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking%20water/dimage1.webp',
        recoTitle: 'Why Do Dogs Need Regular Deworming?',
        recoRead: '3 min read',
        recoStory: 'deworming'
      }
    ]
  },

  deworming: {
    cards: [

      {
        type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/deworming/d1.webp', eyebrow: 'PETOLIFE PET PARENT ACADEMY',
        title: 'Why Do Dogs Need Regular Deworming?',
        body: 'Even healthy-looking dogs can have worms. Regular deworming helps keep your dog healthy and active.',
        author: true
      },

      {
        type: 'info', icon: 'bug', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking+water/d10.webp', title: 'What Are Worms?',
        body: 'Worms are parasites that live inside your dog\u2019s body. They take nutrients from your dog and can affect its health over time.'
      },

      {
        type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/deworming/d2.webp', title: 'Dogs Can Pick Up Worms Easily',
        bullets: ['Sniffing or licking contaminated areas', 'Eating infected food', 'Drinking dirty water', 'Contact with infected animals'
        ]
      },

      {
        type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/deworming/d3.webp', title: 'You May Not Notice Any Signs',
        body: 'Some dogs with worms look completely healthy. That\u2019s why regular deworming is important\u2014even if your dog seems fine.'
      },

      {
        type: 'info', icon: 'shield', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/deworming/d4.webp', title: 'Deworming Helps Protect Your Dog',
        checks: ['Support healthy growth', 'Improve nutrient absorption', 'Reduce the risk of worm-related illness']
      },

      {
        type: 'info', icon: 'calendar', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/deworming/d5.webp', title: 'Every Dog Is Different',
        body: 'Puppies and adult dogs may need different deworming schedules. Your veterinarian will recommend the right plan for your dog.'
      },

      {
        type: 'info', icon: 'shield', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/deworming/d6.webp', title: 'Prevention Comes First',
        body: 'Waiting until your dog becomes sick may be too late. Regular deworming is part of preventive healthcare.'
      },

      {
        type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/deworming/d7.webp', title: ' Has your dog ever missed a deworming dose?',
        options: [' Never', ' Yes, once or twice', ' Yes, several times', ' I\u2019m not sure'],
        responses: [
          'That\u2019s great consistency \u2014 keep following your vet\u2019s recommended schedule.',
          'It happens \u2014 a simple reminder can help you stay on track next time.',
          'You\u2019re not alone \u2014 setting recurring reminders can make it easier to stay consistent.',
          'No worries \u2014 your vet can help you check your dog\u2019s deworming history and get back on schedule.'
        ]
      },

      {
        type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/deworming/d8.webp', title: ' Quick Check: Why should healthy-looking dogs still be dewormed?',
        options: [' Because worms may not show obvious signs.', ' Only dogs with diarrhea need deworming.', ' Only puppies need deworming.', ' Dogs don\u2019t need regular deworming.'],
        responses: [
          'That\u2019s right! Many dogs look and act totally normal even when they have worms.',
          'Not quite \u2014 some dogs show no symptoms at all, so relying on diarrhea alone can miss it.',
          'Not quite \u2014 adult dogs need regular deworming too, not just puppies.',
          'Actually, regular deworming matters for every dog, even ones that look healthy.'
        ]
      },

      {
        type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/deworming/dwebp9.webp', title: 'Great Job!',
        body: 'You just completed \u201CWhy Do Dogs Need Regular Deworming?\u201D',
        recoImg: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/sign1.webp', recoTitle: '10 Early Warning Signs Your Dog May Be Sick', recoRead: '3 min read', recoStory: 'signs'
      }
    ]
  },

  signs: {
    cards: [

      {
        type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/sign1.webp', eyebrow: 'PETOLIFE PET PARENT ACADEMY',
        title: '10 Early Warning Signs Your Dog May Be Sick',
        body: 'Dogs cannot tell us when they feel sick.\n\nBut they often show small warning signs.\n\nLearning these signs can help you get veterinary care early.'
      },

      {
        type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/sign10.webp',
        title: '1. Loss of Appetite',
        body: 'If your dog suddenly refuses food or eats much less than usual, it may be a sign that something isn\'t right.'
      },

      {
        type: 'info', icon: 'stethoscope', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/sign2.webp',
        title: '2. Vomiting or Diarrhea',
        body: 'Occasional stomach upset may happen.\n\nBut repeated vomiting or diarrhea should never be ignored.'
      },

      {
        type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/sign3.webp',
        title: '3. Feeling Tired All the Time',
        body: 'If your usually active dog becomes unusually quiet, weak, or sleeps much more than normal, it\'s worth paying attention.'
      },

      {
        type: 'info', icon: 'stethoscope', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/sign4.webp',
        title: '4. Difficulty Breathing',
        body: 'Fast breathing, heavy panting without exercise, or struggling to breathe needs immediate veterinary attention.'
      },

      {
        type: 'info', icon: 'bug', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/sign5.webp',
        title: '5. Constant Scratching',
        body: 'Frequent scratching, red skin, hair loss, or bad skin odor may be signs of skin or parasite problems.'
      },

      {
        type: 'info', icon: 'clipboard', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/sign6.webp',
        title: '6–10. Other Warning Signs',
        body: 'Watch for:',
        bullets: [
          'Drinking much more water',
          'Weight loss',
          'Limping',
          'Bad breath',
          'Changes in urination or stools'

        ]
      },

      {
        type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/sign7.webp',
        title: ' Small Changes Matter',
        body: 'Many serious illnesses begin with small changes in your dog\'s daily routine.\n\nKnowing your dog\'s normal behavior helps you notice problems early.'
      },

      {
        type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/sign8.webp', title: 'Quick Check ',
        body: 'If your dog\'s behavior suddenly changes and the signs continue, what should you do?',
        options: [
          ' Contact your veterinarian. ',
          ' Wait several weeks.',
          ' Give human medicine.',
          ' Ignore it if your dog is still walking.'
        ],
        responses: [
          'Correct! Contact your veterinarian for advice and a check-up.',
          'Not a good idea \u2014 don\'t wait when signs persist.',
          'Never give human medicine without vet guidance — it can be harmful.',
          'Don\'t ignore persistent changes — contact your veterinarian.'
        ]
      },

      {
        type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/sign9.webp',
        title: ' Great Job!',
        body: 'You just completed \u201C10 Early Warning Signs Your Dog May Be Sick\u201D',
        recoImg: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/pimage1.webp',
        recoTitle: 'Why Is Tick and Flea Prevention Important for Dogs?',
        recoRead: '3 min read',
        recoStory: 'prevention'
      }
    ]
  },

  prevention: {
    cards: [

      {
        type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/pimage1.webp', eyebrow: 'PETOLIFE PET PARENT ACADEMY',
        title: 'Why Is Tick and Flea Prevention Important for Dogs?',
        body: 'Ticks and fleas are tiny parasites.\n\nBut they can cause big problems if they are ignored.'
      },

      {
        type: 'info', icon: 'bug', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/pimage10.webp',
        title: 'Tiny Parasites, Big Trouble',
        body: 'Ticks and fleas live on your dog\'s skin and feed on blood.\n\nThey can make your dog uncomfortable and may spread diseases.'
      },

      {
        type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/pimage2.webp',
        title: 'Dogs Can Pick Them Up Anywhere',
        body: 'Your dog can pick up ticks or fleas from:\n• Parks\n• Grass\n• Other animals\n• Outdoor walks'
      },

      {
        type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/pimage3.webp',
        title: 'Your Dog May Show These Signs',
        body: 'Watch for:\n• Frequent scratching\n• Biting the skin\n• Hair loss\n• Red or irritated skin'
      },

      {
        type: 'info', icon: 'shield', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/pimage4.webp',
        title: 'More Than Just an Itch',
        body: 'Ticks and fleas don\'t just cause itching.\n\nThey can affect your dog\'s skin, make them uncomfortable, and in some cases spread diseases.\n\nThat\'s why early prevention is so important.'
      },

      {
        type: 'info', icon: 'calendar', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/pimage5.webp',
        title: 'Protect Before Problems Start',
        body: 'Regular tick and flea prevention is usually easier than treating an infestation later.\n\nPrevention keeps your dog more comfortable.'
      },

      {
        type: 'info', icon: 'shield', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/pimage6.webp',
        title: 'Every Dog Needs the Right Plan',
        body: 'Your veterinarian can recommend the best tick and flea prevention based on:\n• Your dog\'s age\n• Lifestyle\n• Health'
      },

      {
        type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/pimage8.webp', title: 'Quick Check ',
        body: 'Why is regular tick and flea prevention important?',
        options: [
          'It helps protect your dog before problems begin. ',
          'Only dogs with long hair need protection.',
          'Only puppies get ticks.',
          'Ticks disappear on their own.'
        ],
        responses: [
          'Correct! Prevention helps protect your dog before problems begin.',
          'Not quite — all dogs can benefit from the right prevention.',
          'No — ticks can affect dogs of any age.',
          'No — ticks and fleas do not usually disappear on their own.'
        ]
      },

      {
        type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/pimage7.webp', title: 'Tell Us About Your Dog',
        body: 'Has your dog ever had ticks or fleas?',
        options: [
          'Yes',
          'No',
          'I\'m not sure'
        ],
        responses: [
          'Thanks for sharing — your vet can help with the right prevention plan.',
          'That\'s great — keep watching for changes and stay protected.',
          'A vet check is a good idea to confirm what your dog needs.']
      },
      {
        type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/pimage9.webp',
        title: 'Great Job!',
        body: 'You just completed\nWhy Is Tick and Flea Prevention Important for Dogs?',
        recoImg: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/foimage1.webp',
        recoTitle: 'Which Human Foods Can Be Dangerous for Dogs?',
        recoRead: '3 min read',
        recoStory: 'foods'
      }
    ]
  },

  foods: {
    cards: [

      {
        type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/foimage1.webp', eyebrow: 'PETOLIFE PET PARENT ACADEMY',
        title: 'Which Human Foods Can Be Dangerous for Dogs?',
        body: 'Not everything that\'s safe for us is safe for our dogs.\n\nSome everyday foods can make your dog seriously ill.'
      },

      {
        type: 'info', icon: 'shield', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/foimage10.webp',
        title: 'Dogs Are Different From Humans',
        body: 'Dogs and humans digest food differently.\n\nSome foods that are harmless to us can be harmful to dogs.'
      },

      {
        type: 'info', icon: 'bug', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/foimage2.webp',
        title: 'Some Everyday Foods Can Be Dangerous',
        body: 'Never feed your dog these common foods:\n• Chocolate\n• Grapes & Raisins\n• Onion & Garlic\n• Sugar-free gum or candies (Xylitol)\n\nEven a small amount of some of these foods can be harmful.'
      },

      {
        type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/foimage3.webp',
        title: 'Table Scraps Aren\'t Always Safe',
        body: 'Leftover food may contain ingredients that are unhealthy or unsafe for dogs.\n\nIt\'s always better to feed food made for dogs.'
      },

      {
        type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/foimage4.webp',
        title: '"It Was Only a Small Bite"',
        body: 'Even a small amount of some foods can be harmful.\n\nIf you\'re unsure, it\'s safest not to share it.'
      },

      {
        type: 'info', icon: 'clipboard', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/foimage5.webp',
        title: 'Safe Treats Make Better Rewards',
        body: 'Reward your dog with treats that are made for dogs or approved by your veterinarian.\n\nHealthy choices help your dog stay healthy.'
      },

      {
        type: 'info', icon: 'shield', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/foimage6.webp',
        title: 'Not Sure? Ask First',
        body: 'Before giving your dog a new food, ask your veterinarian if it\'s safe.\n\nA quick question today may prevent a problem tomorrow.'
      },

      {
        type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/foimage8.webp', title: 'Quick Check ',
        body: 'Which of these foods should never be given to dogs?',
        options: [
          'Chocolate ',
          'Plain rice',
          'Plain pumpkin',
          'Carrots'
        ],
        responses: [
          'Correct! Chocolate is dangerous to dogs.',
          'Plain rice is usually safe, but check with your vet first.',
          'Plain pumpkin is usually safe and can be healthy in small amounts.',
          'Carrots are a safe, healthy snack for many dogs.'
        ]
      },

      {
        type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/foimage7.webp', title: 'Tell Us About Your Dog',
        body: 'Have you ever shared your food with your dog?',
        options: [
          'Yes, often',
          'Sometimes',
          'Never',
          'I\'m not sure what\'s safe'
        ],
        responses: [
          'Sharing often can be tempting — keep choosing safe dog-friendly foods.',
          'Sometimes is okay when you check first, but ask your vet when in doubt.',
          'Great! That helps keep your dog safer from unsafe foods.',
          'That\'s a smart question — your vet can help you know what\'s safe.']
      },
      {
        type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/foimage9.webp',
        title: 'Great Job!',
        body: 'You just completed\nWhich Human Foods Can Be Dangerous for Dogs?',
        recoImg: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/feimage1.webp',
        recoTitle: 'How Often Should You Feed Your Dog?',
        recoRead: '3 min read',
        recoStory: 'feeding'
      }
    ]
  },

  feeding: {
    cards: [

      {
        type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/feimage1.webp', eyebrow: 'PETOLIFE PET PARENT ACADEMY',
        title: 'How Often Should You Feed Your Dog?',
        body: 'A healthy feeding routine is just as important as choosing the right food.\n\nLet\'s learn how often dogs should be fed.'
      },

      {
        type: 'info', icon: 'shield', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/feimage10.webp',
        title: 'One Schedule Doesn\'t Fit Every Dog',
        body: 'The right feeding routine depends on:\n• Age\n• Size\n• Activity level\n• Health'
      },

      {
        type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/feimage2.webp',
        title: 'Puppies Eat More Often',
        body: 'Growing puppies usually need smaller meals several times a day to support healthy growth.\n\nYour veterinarian can guide you on the right schedule.'
      },

      {
        type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/feimage3.webp',
        title: 'Adult Dogs Usually Eat Less Often',
        body: 'Many healthy adult dogs are fed twice a day.\n\nAlways follow your veterinarian\'s advice based on your dog\'s needs.'
      },

      {
        type: 'info', icon: 'calendar', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/feimage4.webp',
        title: 'Feed Around the Same Time Every Day',
        body: 'A regular feeding schedule helps your dog know when to expect meals.\n\nRoutine also supports healthy eating habits.'
      },

      {
        type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/feimage5.webp',
        title: 'More Food Isn\'t Always Better',
        body: 'Too much food can lead to weight gain and other health problems.\n\nFeed the right amount, not just more food.'
      },

      {
        type: 'info', icon: 'shield', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/feimage6.webp',
        title: 'Don\'t Forget Water',
        body: 'Always keep clean, fresh drinking water available along with your dog\'s meals.\n\nHydration is just as important as food.'
      },

      {
        type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/feimage8.webp', title: 'Quick Check ',
        body: 'What is one benefit of feeding your dog on a regular schedule?',
        options: [
          'It helps build healthy eating habits. ',
          'It makes dogs taller.',
          'Dogs can eat unlimited food.',
          'Water is no longer needed.'
        ],
        responses: [
          'Correct! A regular schedule helps build healthy eating habits.',
          'No — feeding schedules do not make dogs taller.',
          'No — dogs still need the right amount of food, not unlimited food.',
          'No — water is always important, even with a regular feeding routine.'
        ]
      },

      {
        type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/feimage7.webp', title: 'Tell Us About Your Dog',
        body: 'How many times do you feed your dog each day?',
        options: [
          'Once',
          'Twice',
          'Three or more times',
          'It depends'
        ],
        responses: [
          'Good to know. Every dog is different, and the right routine depends on your dog.',
          'Twice a day is common for many adult dogs, but your vet may suggest another plan.',
          'Some dogs do well with three smaller meals, especially growing puppies or active dogs.',
          'That\'s okay — feeding frequency can change based on age, size, and health.']
      },
      {
        type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/feimage9.webp',
        title: 'Great Job!',
        body: 'You just completed\nHow Often Should You Feed Your Dog?',
        recoImg: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking%20water/dimage1.webp',
        recoTitle: 'How Often Should You Change Your Dog\u2019s Drinking Water?',
        recoRead: '3 min read',
        recoStory: 'drinking'
      }
    ]
  },

  drinking: {
    cards: [

      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking%20water/dimage1.webp', eyebrow: 'PETOLIFE PET PARENT ACADEMY', title: 'How Often Should You Change Your Dog\'s Drinking Water?', body: 'Food is important.\nBut fresh, clean drinking water is just as important for your dog\'s health.', author: true },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking%20water/dimage2.webp', title: 'Water Keeps Your Dog Healthy', body: 'Your dog\'s body needs water every day to stay healthy, active, and hydrated.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking%20water/dimage3.webp', title: 'Clean Water Matters', body: 'Dust, saliva, food particles, and dirt can collect in the water bowl during the day.\nFresh water is always the better choice.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking%20water/dimage4.webp', title: 'Make It a Daily Habit', body: 'Replace your dog\'s drinking water with clean, fresh water every day.\nWash the bowl regularly to keep it clean.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking%20water/dimage5.webp', title: 'Dogs Drink More in Summer', body: 'During hot weather or after exercise, dogs usually drink more water.\nAlways make sure fresh water is available.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking%20water/dimage6.webp', title: 'Notice Your Dog\'s Drinking Habits', body: 'If your dog suddenly drinks much more or much less than usual, talk to your veterinarian.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking%20water/dimage7.webp', title: 'Never Let the Bowl Stay Empty', body: 'Always make sure your dog has access to clean drinking water throughout the day.' },
      { type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking%20water/dimage9.webp', title: 'Quick Check \nWhy should you change your dog\'s drinking water regularly?', options: ['To keep it clean and fresh.', 'Water never gets dirty.', 'Dogs only drink after meals.', 'Dogs don\'t need fresh water every day.'], responses: ['Correct! Clean water prevents bacteria.', 'Not quite — dust and saliva make it dirty.', 'Not quite — they need water all day.', 'Not quite — fresh water is essential daily.'] },
      { type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking%20water/dimage8.webp', title: 'Tell Us About Your Dog\nHow often do you change your dog\'s drinking water?', options: ['More than once a day', 'Once a day', 'Every two days', 'Only when the bowl is empty'], responses: ['Excellent! Fresh water is best.', 'Good habit!', 'Try changing it daily for better hygiene.', 'It\'s best to change it daily even if not empty.'] },
      { type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking+water/dimage10.webp', title: 'Great Job!', body: 'You just completed "How Often Should You Change Your Dog\'s Drinking Water?"', recoImg: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/exercise/eimage1.webp', recoTitle: 'How Much Exercise Does Your Dog Need Every Day?', recoRead: '1 min read', recoStory: 'exercise' }
    ]
  },

  exercise: {
    cards: [

      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/exercise/eimage1.webp', eyebrow: 'PETOLIFE PET PARENT ACADEMY', title: 'How Much Exercise Does Your Dog Need Every Day?', body: 'Exercise isn\'t just about burning energy.\nIt helps keep your dog healthy, happy, and mentally active.', author: true },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/exercise/eimage10.webp', title: 'One Routine Doesn\'t Fit Every Dog', body: 'The right amount of exercise depends on:\n• Age\n• Breed\n• Health\n• Energy level' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/exercise/eimage2.webp', title: 'Playtime Counts Too', body: 'Walking, playing, running, and interactive games all help keep your dog active and engaged.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/exercise/eimage3.webp', title: 'Why Daily Activity Matters', body: 'Regular exercise can help:\n• Maintain a healthy weight\n• Support strong muscles\n• Keep your dog mentally active' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/exercise/eimage4.webp', title: 'A Bored Dog May Show It', body: 'Dogs that don\'t get enough activity may become bored.\nSome may chew furniture, dig, bark more, or become restless.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/exercise/eimage5.webp', title: 'A Little Every Day Matters', body: 'Even a short daily walk or play session is better than doing nothing.\nConsistency is the key.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/exercise/eimage6.webp', title: 'Let Your Dog Set the Pace', body: 'Watch how your dog feels during and after exercise.\nIf you notice unusual tiredness or discomfort, speak with your veterinarian.' },
      { type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/exercise/eimage8.webp', title: 'Quick Check \nWhy is regular exercise important for dogs?', options: ['It supports both physical and mental health.', 'Dogs only need exercise when they\'re puppies.', 'Exercise is only for large breeds.', 'Healthy dogs don\'t need daily activity.'], responses: ['Correct! Physical and mental health are key.', 'Not quite — all ages need it.', 'Not quite — all breeds need it.', 'Not quite — daily activity is essential.'] },
      { type: 'survey', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/exercise/eimage7.webp', title: 'Tell Us About Your Dog\nHow often do you take your dog for a walk or play session?', options: ['Every day', 'A few times a week', 'Occasionally', 'Rarely'], responses: ['Great job keeping them active!', 'Good, but daily is better.', 'Try to increase the frequency.', 'Start with a short walk today!'] },
      { type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/exercise/eimage9.webp', title: '🎉 Congratulations!', body: 'You\'ve completed the Phase 1 Learning Series of the PetOlife Pet Parent Academy.\nKeep learning, keep caring, and help your pet live a healthier, happier life.\nMore pet care stories are coming soon.', recoImg: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking%20water/dimage1.webp', recoTitle: 'How Often Should You Change Your Dog\'s Drinking Water?', recoRead: '1 min read', recoStory: 'drinking' }
    ]
  },
















  birds_checkups: {
    cards: [

      { type: 'info', icon: 'heartbeat', img: 'images/card1.png', eyebrow: 'PETOLIFE PET PARENT ACADEMY', title: 'Why Do Pet Birds Need Regular Health Check-ups?', body: 'Birds may look healthy even when they are unwell.\nRegular health check-ups can help detect problems early.', author: true },
      { type: 'info', icon: 'eye-slash', img: 'images/card2.png', title: 'Birds Often Hide When They\'re Sick', body: 'Many birds naturally hide signs of illness.\nThat\'s why small changes in their behavior should never be ignored.' },
      { type: 'info', icon: 'eye', img: 'images/card3.png', title: 'Watch for Small Changes', body: 'Pay attention if your bird:\n• Eats less\n• Becomes quiet\n• Sleeps more\n• Stops playing' },
      { type: 'info', icon: 'medkit', img: 'images/card4.png', title: 'Prevention Is Better Than Waiting', body: 'Regular veterinary check-ups can help identify health problems before they become serious.' },
      { type: 'info', icon: 'check-circle', img: 'images/card5.png', title: 'Don\'t Wait Until Your Bird Is Sick', body: 'Even healthy-looking birds benefit from regular health check-ups.\nPrevention is an important part of good bird care.' },
      { type: 'info', icon: 'user', img: 'images/card6.png', title: 'You Know Your Bird Best', body: 'Watching your bird every day helps you notice changes in behavior, eating, or activity.' },
      { type: 'info', icon: 'leaf', img: 'images/card7.png', title: 'Healthy Habits Matter', body: 'Good food, clean water, a clean cage, and regular veterinary care all help keep your bird healthy.' },
      {
        type: 'poll', img: 'images/card8.png', title: 'Tell Us About Your Bird', question: 'Has your bird ever had a veterinary health check-up?', options: ['Yes', 'Once', 'Never', 'Planning to schedule one'
        ]
      },
      { type: 'quiz', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking%20water/dimage9.webp', title: 'Quick Check ', question: 'Why are regular health check-ups important for pet birds?', options: ['Birds often hide signs of illness.', 'Birds don\'t get sick.', 'Only old birds need check-ups.', 'Birds only need a vet after an injury.'], answer: 0 },
      { type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking+water/dimage10.webp', title: 'Great Job!', body: 'You just completed\nWhy Do Pet Birds Need Regular Health Check-ups?', recoImg: '/blog-assets/dog.jfif', recoTitle: 'What Should You Feed Your Pet Bird Every Day?', recoRead: '1 min read', recoStory: 'birds_feeding' }
    ]
  },
  birds_feeding: {
    cards: [

      { type: 'info', icon: 'cutlery', img: 'images/card1.png', eyebrow: 'PETOLIFE PET PARENT ACADEMY', title: 'What Should You Feed Your Pet Bird Every Day?', body: 'A healthy diet helps your bird stay active, colorful, and full of energy.\nLet\'s learn the basics of feeding your pet bird.', author: true },
      { type: 'info', icon: 'info-circle', img: 'images/card2.png', title: 'Different Birds Have Different Needs', body: 'The right diet depends on your bird\'s:\n• Species\n• Age\n• Health\n• Your veterinarian\'s advice' },
      { type: 'info', icon: 'leaf', img: 'images/card3.png', title: 'A Balanced Diet Matters', body: 'Many pet birds enjoy seeds.\nBut most birds also need a balanced diet that may include pellets, fresh vegetables, and other foods recommended for their species.' },
      { type: 'info', icon: 'cutlery', img: 'images/card4.png', title: 'Fresh Food Every Day', body: 'Offer fresh food and remove leftovers before they spoil.\nClean food helps keep your bird healthy.' },
      { type: 'info', icon: 'tint', img: 'images/card5.png', title: 'Fresh Water Every Day', body: 'Always provide clean, fresh drinking water.\nReplace the water daily and keep the bowl clean.' },
      { type: 'info', icon: 'ban', img: 'images/card6.png', title: 'Not Every Human Food Is Safe', body: 'Avoid feeding chips, chocolates, sugary foods, or salty snacks.\nWhen in doubt, ask your veterinarian.' },
      { type: 'info', icon: 'eye', img: 'images/card7.png', title: 'Eating Habits Can Tell You a Lot', body: 'If your bird suddenly stops eating or eats much less than usual, consult your veterinarian.' },
      {
        type: 'poll', img: 'images/card8.png', title: 'Tell Us About Your Bird', question: 'What does your bird eat most often?', options: ['Mostly seeds', 'Seeds and fresh foods', 'Pellets and fresh foods', 'I\'m not sure if the diet is balanced'
        ]
      },
      { type: 'quiz', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking%20water/dimage9.webp', title: 'Quick Check ', question: 'Which statement is true?', options: ['Most pet birds need more than just seeds.', 'Seeds are enough for every bird.', 'Birds don\'t need fresh water every day.', 'Human snacks are safe for birds.'], answer: 0 },
      { type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking+water/dimage10.webp', title: 'Great Job!', body: 'You just completed\nWhat Should You Feed Your Pet Bird Every Day?\nKeep learning with the PetOlife Pet Parent Academy.\nMore bird care stories are coming soon.' }
    ]
  },
  cats_prevention: {
    cards: [

      { type: 'info', icon: 'shield', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/cpimage1.webp', eyebrow: 'PETOLIFE PET PARENT ACADEMY', title: 'Why Is Flea and Tick Prevention Important for Cats?', body: 'Tiny parasites can make a big difference to your cat\'s health.\nRegular prevention helps keep your cat comfortable and protected.', author: true },
      { type: 'info', icon: 'bug', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/cpimage10.webp', title: 'Tiny Parasites, Big Problems', body: 'Fleas and ticks are tiny parasites that live on your cat\'s skin.\nThey feed on blood and can affect your cat\'s health.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/cpimage2.webp', title: 'Cats Can Pick Them Up Easily', body: 'Cats can pick up fleas or ticks from:\n• Outdoor areas\n• Other animals\n• Gardens\n• Even inside the home' },
      { type: 'info', icon: 'home', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/cpimage3.webp', title: '"My Cat Never Goes Outside."', body: 'Many people believe indoor cats can\'t get fleas or ticks.\nThat\'s not always true.\nParasites can sometimes find their way indoors.' },
      { type: 'info', icon: 'stethoscope', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/cpimage4.webp', title: 'More Than Just an Itch', body: 'Fleas and ticks don\'t just cause itching.\nThey can affect your cat\'s skin, make them uncomfortable, and in some cases spread diseases.\nThat\'s why early prevention is so important.' },
      { type: 'info', icon: 'eye', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/cpimage5.webp', title: 'Signs Your Cat May Have Fleas or Ticks', body: 'Watch for:\n• Frequent scratching\n• Hair loss\n• Red or irritated skin\n• Tiny black specks in the fur' },
      { type: 'info', icon: 'shield-check', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/cpimage6.webp', title: 'Protect Before Problems Begin', body: 'Regular flea and tick prevention is usually easier than treating an infestation later.\nIt helps keep your cat healthy and comfortable.' },
      {
        type: 'poll', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/cpimage7.webp', title: 'Tell Us About Your Cat', question: 'Has your cat ever had fleas or ticks?', options: ['Yes', 'No', 'I\'m not sure'
        ]
      },
      { type: 'quiz', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/cpimage8.webp', title: 'Quick Check ', question: 'Can indoor cats still need flea and tick prevention?', options: ['Yes, they can still be exposed.', 'No, indoor cats are always safe.', 'Only kittens need protection.', 'Fleas and ticks only live outdoors.'], answer: 0 },
      { type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/cpimage9.webp', title: 'Great Job!', body: 'You just completed\nWhy Is Flea and Tick Prevention Important for Cats?', recoImg: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/cfoimage1.webp', recoTitle: 'Which Human Foods Can Be Dangerous for Cats?', recoRead: '1 min read', recoStory: 'cats_foods' }
    ]
  },
  cats_signs: {
    cards: [

      { type: 'info', icon: 'eye', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/csimage1.webp', eyebrow: 'PETOLIFE PET PARENT ACADEMY', title: '10 Early Warning Signs Your Cat May Be Sick', body: 'Cats are very good at hiding pain and illness.\nKnowing the early warning signs can help you get veterinary care before the problem becomes serious.', author: true },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/csimage10.webp', title: '1. Loss of Appetite', body: 'If your cat suddenly stops eating or eats much less than usual, don\'t ignore it.\nIt may be an early sign that something is wrong.' },
      { type: 'info', icon: 'eye-slash', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/csimage2.webp', title: '2. Hiding All the Time', body: 'Cats often hide when they don\'t feel well.\nIf your friendly cat suddenly avoids people or stays hidden, it deserves attention.' },
      { type: 'info', icon: 'exclamation', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/csimage3.webp', title: '3. Vomiting or Diarrhea', body: 'An occasional hairball may be normal.\nBut repeated vomiting or diarrhea should always be discussed with your veterinarian.' },
      { type: 'info', icon: 'moon-o', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/csimage4.webp', title: '4. Less Active Than Usual', body: 'If your playful cat suddenly becomes quiet, weak, or sleeps much more than usual, pay close attention.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/csimage5.webp', title: '5. Grooming Less or Too Much', body: 'A healthy cat usually keeps itself clean.\nSudden changes in grooming may be a sign of illness or discomfort.' },
      { type: 'info', icon: 'list', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/csimage6.webp', title: '6–10. Other Signs to Watch For', body: 'Watch for:\n• Weight loss\n• Difficulty urinating\n• Trouble breathing\n• Bad breath\n• Changes in litter box habits' },
      { type: 'info', icon: 'lightbulb-o', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/csimage7.webp', title: 'Small Changes Matter', body: 'Cats often hide illness until it becomes serious.\nKnowing your cat\'s normal behavior helps you notice problems early.' },
      { type: 'quiz', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/csimage8.webp', title: 'Quick Check ', question: 'Why is it important to notice small behavior changes in cats?', options: ['Because cats often hide illness.', 'Cats are always lazy.', 'Cats never get sick.', 'Cats don\'t need veterinary care.'], answer: 0 },
      { type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/csimage9.webp', title: 'Great Job!', body: 'You just completed\n10 Early Warning Signs Your Cat May Be Sick', recoImg: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/cpimage1.webp', recoTitle: 'Why Is Flea and Tick Prevention Important for Cats?', recoRead: '1 min read', recoStory: 'cats_prevention' }

    ]
  },
  cats_deworming: {
    cards: [

      { type: 'info', icon: 'bug', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/deworming/cdimage1.webp', eyebrow: 'PETOLIFE PET PARENT ACADEMY', title: 'Why Do Cats Need Regular Deworming?', body: 'Even healthy-looking cats can have worms.\nRegular deworming helps keep your cat healthy, active, and comfortable.', author: true },
      { type: 'info', icon: 'bug', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/deworming/cdimage10.webp', title: 'What Are Worms?', body: 'Worms are parasites that live inside your cat\'s body.\nThey take nutrients from your cat and may affect its health over time.' },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/deworming/cdimage2.webp', title: 'Cats Can Pick Up Worms Easily', body: 'Cats can get worms by:\n• Hunting small animals\n• Eating contaminated food\n• Drinking dirty water\n• Contact with infected animals' },
      { type: 'info', icon: 'home', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/deworming/cdimage3.webp', title: '"My Cat Never Goes Outside."', body: 'Many people believe indoor cats don\'t need deworming.\nThat\'s not always true.\nIndoor cats can still be exposed to parasites in different ways.' },
      { type: 'info', icon: 'shield', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/deworming/cdimage4.webp', title: 'Deworming Helps Protect Your Cat', body: 'Regular deworming can help:\n• Support healthy growth\n• Improve nutrient absorption\n• Reduce the risk of worm-related illness' },
      { type: 'info', icon: 'user-md', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/deworming/cdimage5.webp', title: 'Every Cat Is Different', body: 'Kittens and adult cats may need different deworming schedules.\nYour veterinarian will recommend the right plan for your cat.' },
      { type: 'info', icon: 'calendar', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/deworming/cdimage6.webp', title: 'Don\'t Wait for Symptoms', body: 'Some cats with worms may not show obvious signs.\nRegular deworming helps protect your cat before problems develop.' },
      {
        type: 'poll', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/deworming/cdimage7.webp', title: 'Tell Us About Your Cat', question: 'Has your cat ever missed a deworming dose?', options: ['Never', 'Yes, once or twice', 'Yes, several times', 'I\'m not sure'
        ]
      },
      { type: 'quiz', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/deworming/cdimage8.webp', title: 'Quick Check ', question: 'Why should healthy-looking cats still be dewormed?', options: ['Because worms may not show obvious signs.', 'Only outdoor cats need deworming.', 'Only kittens need deworming.', 'Cats only need deworming when they stop eating.'], answer: 0 },
      { type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/deworming/cdimage9.webp', title: 'Great Job!', body: 'You just completed\nWhy Do Cats Need Regular Deworming?', recoImg: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/signs/csimage1.webp', recoTitle: '10 Early Warning Signs Your Cat May Be Sick', recoRead: '1 min read', recoStory: 'cats_signs' }
    ]
  },
  cats_vaccinations: {
    cards: [

      { type: 'info', icon: 'syringe', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/vaccination/cvimage1.webp', eyebrow: 'PETOLIFE PET PARENT ACADEMY', title: 'Why Do Cats Need Vaccinations?', body: 'Even healthy-looking cats can get serious diseases.\nVaccination helps protect your cat before illness strikes.', author: true },
      { type: 'info', icon: 'shield', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/vaccination/cvimage10.webp', title: 'Vaccines Help Protect Your Cat', body: 'Vaccines help your cat\'s body recognize and fight harmful diseases.\nThis protection can reduce the risk of serious illness.' },
      { type: 'info', icon: 'heartbeat', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/vaccination/cvimage2.webp', title: 'Kittens Need Several Vaccines', body: 'Kittens are still developing their immune system.\nThey need several vaccines during their first few months to build strong protection.' },
      { type: 'info', icon: 'home', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/vaccination/cvimage3.webp', title: '"My Cat Never Goes Outside."', body: 'Many people believe indoor cats don\'t need vaccines.\nThat\'s not always true.\nYour veterinarian will recommend vaccines based on your cat\'s lifestyle and health needs.' },
      { type: 'info', icon: 'shield-check', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/vaccination/cvimage4.webp', title: 'Vaccines Can Protect Against', body: 'Vaccines help protect cats from diseases such as:\n• Feline Panleukopenia\n• Cat Flu\n• Rabies\nYour veterinarian will guide you on the vaccines your cat needs.' },
      { type: 'info', icon: 'medkit', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/vaccination/cvimage5.webp', title: 'Protect Before Problems Begin', body: 'Vaccination is one of the easiest ways to help keep your cat healthy.\nPreventing disease is often safer than treating it later.' },
      { type: 'info', icon: 'calendar', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/vaccination/cvimage6.webp', title: 'Don\'t Miss Booster Vaccines', body: 'Vaccines protect best when they are given on time.\nAlways follow your veterinarian\'s recommended vaccination schedule.' },
      {
        type: 'poll', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/vaccination/cvimage7.webp', title: 'Tell Us About Your Cat', question: 'Is your cat\'s vaccination currently up to date?', options: ['Yes, all vaccinations are completed.', 'Some vaccinations are pending.', 'My cat has missed vaccinations.', 'I\'m not sure.'
        ]
      },
      { type: 'quiz', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/vaccination/cvimage8.webp', title: 'Quick Check ', question: 'Which cats may need vaccinations?', options: ['Only outdoor cats', 'Both indoor and outdoor cats', 'Only kittens', 'Only senior cats'], answer: 1 },
      { type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/vaccination/cvimage9.webp', title: 'Great Job!', body: 'You just completed\nWhy Do Cats Need Vaccinations?', recoImg: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/care/drinking%20water/dimage1.webp', recoTitle: 'Why Do Dogs Need Regular Deworming?', recoRead: '1 min read', recoStory: 'deworming' }
    ]
  },
  cats_feeding: {
    cards: [

      { type: 'info', icon: 'cutlery', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/cfimage1.webp', eyebrow: 'PETOLIFE PET PARENT ACADEMY', title: 'How Often Should You Feed Your Cat?', body: 'A healthy feeding routine helps your cat stay active and healthy.\nLet\'s understand why a regular meal schedule matters.', author: true },
      { type: 'info', icon: 'paw', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/cfimage10.webp', title: 'Every Cat Has Different Needs', body: 'The right feeding routine depends on:\n• Age\n• Activity level\n• Health\n• Your veterinarian\'s advice' },
      { type: 'info', icon: 'clock-o', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/cfimage2.webp', title: 'Kittens Eat More Often', body: 'Growing kittens usually need smaller meals several times a day to support healthy growth.\nYour veterinarian can guide you on the right schedule.' },
      { type: 'info', icon: 'clock-o', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/cfimage3.webp', title: 'Adult Cats Usually Eat Less Often', body: 'Many healthy adult cats are fed twice a day.\nYour veterinarian can recommend the best routine for your cat.' },
      { type: 'info', icon: 'calendar-check-o', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/cfimage4.webp', title: 'Feed at the Same Time Every Day', body: 'Cats enjoy a consistent routine.\nFeeding meals at regular times helps many cats feel comfortable and secure.' },
      { type: 'info', icon: 'balance-scale', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/cfimage5.webp', title: 'More Food Isn\'t Always Better', body: 'Giving too much food can lead to weight gain and other health problems.\nFeed the right amount, not just more food.' },
      { type: 'info', icon: 'tint', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/cfimage6.webp', title: 'Don\'t Forget Fresh Water', body: 'Always keep clean, fresh drinking water available.\nGood hydration is an important part of your cat\'s daily health.' },
      {
        type: 'poll', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/cfimage7.webp', title: 'Tell Us About Your Cat', question: 'How many times do you feed your cat each day?', options: ['Once', 'Twice', 'Three or more times', 'It depends'
        ]
      },
      { type: 'quiz', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/cfimage8.webp', title: 'Quick Check ', question: 'Why is a regular feeding routine important for many cats?', options: ['It helps them feel comfortable and supports healthy eating habits.', 'Cats should eat whenever they want.', 'Cats don\'t need a routine.', 'Water is more important than food.'], answer: 0 },
      { type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/cfimage9.webp', title: 'Great Job!', body: 'You just completed\nHow Often Should You Feed Your Cat?', recoImg: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/everyday/drinking/cdimage10.webp', recoTitle: 'Is Your Cat Drinking Enough Water?', recoRead: '1 min read', recoStory: 'cats_drinking' }
    ]
  },
  cats_foods: {
    cards: [

      { type: 'info', icon: 'exclamation-triangle', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/cfoimage1.webp', eyebrow: 'PETOLIFE PET PARENT ACADEMY', title: 'Which Human Foods Can Be Dangerous for Cats?', body: 'Not everything that\'s safe for us is safe for our cats.\nSome everyday foods can make your cat seriously ill.', author: true },
      { type: 'info', icon: 'info-circle', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/cfoimage10.webp', title: 'Cats Are Different From Humans', body: 'Cats have different nutritional needs.\nSome foods that are harmless to people can be harmful to cats.' },
      { type: 'info', icon: 'ban', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/cfoimage2.webp', title: 'Never Feed These Foods', body: 'Never feed your cat these common foods:\n• Chocolate\n• Onion & Garlic\n• Grapes & Raisins\n• Sugar-free gum or candies (Xylitol)\nEven a small amount of some of these foods can be harmful.' },
      { type: 'info', icon: 'glass', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/cfoimage3.webp', title: 'The Milk Myth', body: 'Many adult cats have difficulty digesting milk.\nGiving milk may upset their stomach.\nFresh water is usually the best choice.' },
      { type: 'info', icon: 'cutlery', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/cfoimage4.webp', title: 'Human Food Isn\'t Always Cat Food', body: 'Table scraps may contain ingredients that are unhealthy or unsafe for cats.\nIt\'s always safer to feed food made for cats.' },
      { type: 'info', icon: 'star', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/cfoimage5.webp', title: 'Reward with Safe Treats', body: 'Choose treats made for cats or recommended by your veterinarian.\nHealthy treats are a better reward.' },
      { type: 'info', icon: 'question-circle', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/cfoimage6.webp', title: 'Not Sure? Ask First', body: 'Before offering a new food, ask your veterinarian if it\'s safe for your cat.\nA simple question today may prevent a health problem tomorrow.' },
      {
        type: 'poll', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/cfoimage7.webp', title: 'Tell Us About Your Cat', question: 'Have you ever shared your food with your cat?', options: ['Yes, often', 'Sometimes', 'Never', 'I\'m not sure what\'s safe'
        ]
      },
      { type: 'quiz', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/cfoimage8.webp', title: 'Quick Check ', question: 'Which drink is usually the best choice for most adult cats?', options: ['Fresh water', 'Milk', 'Fruit juice', 'Soft drinks'], answer: 0 },
      { type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/food/cfoimage9.webp', title: 'Great Job!', body: 'You just completed\nWhich Human Foods Can Be Dangerous for Cats?', recoImg: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/nutrition/feed/cfimage1.webp', recoTitle: 'How Often Should You Feed Your Cat?', recoRead: '1 min read', recoStory: 'cats_feeding' }
    ]
  },
  cats_drinking: {
    cards: [

      { type: 'info', icon: 'tint', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/everyday/drinking/cdimage10.webp', eyebrow: 'PETOLIFE PET PARENT ACADEMY', title: 'Is Your Cat Drinking Enough Water?', body: 'Cats don\'t always drink as much water as they should.\nKeeping your cat well hydrated is an important part of staying healthy.', author: true },
      { type: 'info', icon: 'heartbeat', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/everyday/drinking/cdimage2.webp', title: 'Water Keeps Your Cat Healthy', body: 'Water helps your cat stay active, supports body functions, and keeps them hydrated every day.' },
      { type: 'info', icon: 'glass', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/everyday/drinking/cdimage3.webp', title: 'Fresh Water Is More Appealing', body: 'Cats are more likely to drink fresh, clean water.\nReplacing the water daily helps encourage healthy drinking habits.' },
      { type: 'info', icon: 'shower', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/everyday/drinking/cdimage4.webp', title: 'Clean Bowl, Fresh Water', body: 'Wash your cat\'s water bowl regularly and refill it with fresh water every day.\nA clean bowl helps keep the water fresh.' },
      { type: 'info', icon: 'check-square-o', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/everyday/drinking/cdimage5.webp', title: 'Never Let the Bowl Stay Empty', body: 'Your cat should always have access to clean drinking water throughout the day.' },
      { type: 'info', icon: 'eye', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/everyday/drinking/cdimage6.webp', title: 'Watch Your Cat\'s Drinking Habits', body: 'If your cat suddenly drinks much more or much less than usual, speak with your veterinarian.' },
      { type: 'info', icon: 'cutlery', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/everyday/drinking/cdimage7.webp', title: 'Wet Food Can Support Hydration', body: 'Wet food contains more moisture than dry food and can help increase your cat\'s daily water intake.' },
      {
        type: 'poll', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/everyday/drinking/cdimage8.webp', title: 'Tell Us About Your Cat', question: 'How often do you replace your cat\'s drinking water?', options: ['More than once a day', 'Once a day', 'Every two days', 'Only when the bowl is empty'
        ]
      },
      { type: 'quiz', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/everyday/drinking/cdimage9.webp', title: 'Quick Check ', question: 'Why should fresh water always be available for your cat?', options: ['To help keep your cat hydrated and healthy.', 'Cats only drink after meals.', 'Water doesn\'t need to be changed daily.', 'Dry food provides enough water.'], answer: 0 },
      { type: 'summary', img: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/everyday/drinking/cdrimage1.webp', title: 'Great Job!', body: 'You just completed\nIs Your Cat Drinking Enough Water?', recoImg: 'https://petolife-blog-images-141927126120-ap-south-1-an.s3.ap-south-1.amazonaws.com/health%26prevention/prevention/cpimage1.webp', recoTitle: 'Why Is Flea and Tick Prevention Important for Cats?', recoRead: '1 min read', recoStory: 'cats_prevention' }
    ]
  },


};

const urlParams = new URLSearchParams(window.location.search);
const requestedStory = urlParams.get('story');
let storyKey = (requestedStory && STORIES[requestedStory]) ? requestedStory : 'vaccinations';
let CARDS = STORIES[storyKey].cards;
let current = 0;
const surveyAnswered = {};

const barsEl = document.getElementById('bars');
const slidesEl = document.getElementById('slides');
const phone = document.getElementById('phone');
const storyMeta = document.getElementById('storyMeta');

function buildBars() {
  barsEl.innerHTML = '';
  CARDS.forEach((_, i) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    const fill = document.createElement('div');
    fill.className = 'bar-fill';
    fill.id = 'fill-' + i;
    bar.appendChild(fill);
    barsEl.appendChild(bar);
  });
}

function authorHtml() {
  return `<div class="author-row">
    <div class="author-name">Story by <b>${AUTHOR.name}</b> \u00B7 ${AUTHOR.role}</div>
  </div>`;
}

function buildSlides() {
  slidesEl.innerHTML = '';
  CARDS.forEach((c, i) => {
    const div = document.createElement('div');
    div.className = 'slide';
    div.id = 'slide-' + i;

    const sceneHtml = `<div class="scene" style="background-image:url('${c.img}');"></div>`;

    if (c.type === 'info') {
      let checksHtml = '';
      if (c.checks) {
        checksHtml = '<ul class="check-list">' + c.checks.map(t =>
          '<li>' + ICONS.check + '<span>' + t + '</span></li>'
        ).join('') + '</ul>';
      }
      let bulletsHtml = '';
      if (c.bullets) {
        bulletsHtml = '<ul class="bullet-list">' + c.bullets.map(t =>
          '<li><svg viewBox="0 0 24 24" width="8" height="8" stroke="none" style="margin-top:6px;"><circle cx="12" cy="12" r="10"></circle></svg><span>' + t + '</span></li>'
        ).join('') + '</ul>';
      }
      div.innerHTML = `
        ${sceneHtml}
        ${i === 0 ? brandLogoHtml() : ''}
        <div class="panel${c.author ? ' panel-cover' : ''}">
          <div class="eyebrow">${c.eyebrow || ''}</div>
          <h1 class="slide-title">${c.title}</h1>
          <div class="underline"></div>
          ${c.body ? `<p class="body-text">${c.body}</p>` : ''}
          ${checksHtml}${bulletsHtml}
          ${c.footnote ? `<div class="footnote">${c.footnote}</div>` : ''}
          ${c.author ? authorHtml() : ''}
        </div>
      `;
    }

    if (c.type === 'survey' || c.type === 'poll' || c.type === 'quiz') {
      const optsHtml = c.options.map((opt, idx) => `
        <button class="opt" data-idx="${idx}" data-card="${i}">
          <span>${opt}</span>
          <svg class="check" viewBox="0 0 24 24" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5 11-11"></path></svg>
        </button>
      `).join('');

      let displayTitle = c.title || '';
      if (displayTitle.toLowerCase().includes('quick check')) {
          displayTitle = displayTitle.replace(/✅/g, '').replace(/quick check/ig, '').trim();
          displayTitle = displayTitle.replace(/^[\s:\n\-]+/, '');
          displayTitle = displayTitle.replace(/^(<br\s*\/?>)+/i, '').trim();
      }

      const questionText = c.question ? `${displayTitle ? displayTitle + '<br/>' : ''}<span style="font-size:0.9em;font-weight:normal;opacity:0.9;display:block;margin-top:8px;">${c.question}</span>` : displayTitle;

      div.innerHTML = `
        ${sceneHtml}
        <div class="panel">
          <div class="eyebrow eyebrow-dark">${c.title && c.title.toLowerCase().includes('quick check') ? 'KNOWLEDGE CHECK' : 'QUICK SURVEY'}</div>
          <p class="poll-q">${questionText}</p>
          ${c.body ? `<p class="body-text" style="margin-bottom:10px;">${c.body}</p>` : ''}
          <div class="underline"></div>
          <div class="opts-wrap">${optsHtml}</div>
          <div class="response-box" id="response-${i}" style="display:none;"></div>
        </div>
      `;
    }

    if (c.type === 'myth') {
      div.innerHTML = `
        ${sceneHtml}
        <div class="panel">
          <div class="eyebrow"></div>
          <h1 class="slide-title">${c.title}</h1>
          <div class="underline"></div>
          <div class="myth-row"><span class="myth-tag no">❌</span><span>${c.myth}</span></div>
          <div class="myth-row"><span class="myth-tag yes"></span><span>${c.fact}</span></div>
        </div>
      `;
    }

    if (c.type === 'summary') {
      const pointsHtml = c.points ? '<ul class="summary-list">' + c.points.map(t =>
        '<li>' + ICONS.check + '<span>' + t + '</span></li>'
      ).join('') + '</ul>' : '';
      const recoHtml = c.recoImg ? `
        <div class="reco-label" style="margin-top:18px;">Recommended next</div>
        <div class="reco-card" id="recoCard" style="cursor:pointer;">
          <div class="reco-thumb" style="background-image:url('${c.recoImg}');"></div>
          <div class="reco-info">
            <p class="reco-title">${c.recoTitle}</p>
            <div class="reco-meta"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 3"></path></svg>${c.recoRead}</div>
          </div>
          <svg class="reco-arrow" viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>` : '';
      div.innerHTML = `
        ${sceneHtml}
        <div class="panel">
          ${c.eyebrow ? `<div class="eyebrow">${c.eyebrow}</div>` : ''}
          <h1 class="slide-title">${c.title}</h1>
          <div class="underline"></div>
          ${c.body ? `<p class="body-text">${c.body}</p>` : ''}
          ${pointsHtml}
          ${recoHtml}
        </div>
      `;
    }

    if (c.type === 'end') {
      div.innerHTML = `
        ${sceneHtml}
        <div class="panel">
          <div class="end-icon">${ICONS.check}</div>
          <h1 class="slide-title">${c.title}</h1>
          <div class="underline"></div>
          <p class="body-text">${c.body}</p>
          <button class="replay-btn" id="replayBtn">Back to Deworming story ↻</button>
        </div>
      `;
    }

    slidesEl.appendChild(div);
  });
}

function attachHandlers() {
  document.querySelectorAll('.opt').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cardIdx = parseInt(btn.dataset.card, 10);
      if (surveyAnswered[cardIdx]) return;
      surveyAnswered[cardIdx] = true;

      const chosen = parseInt(btn.dataset.idx, 10);
      const card = CARDS[cardIdx];
      card.options.forEach((_, idx) => {
        const optBtn = document.querySelector(`.opt[data-card="${cardIdx}"][data-idx="${idx}"]`);
        optBtn.classList.add('answered');
        if (idx === chosen) optBtn.classList.add('selected');
      });
      // Send survey result to backend
      const url = "https://script.google.com/macros/s/AKfycbxZ952Ttlx74qftwGro1-0E7YYfwt3rN7z1gEpYhx08CLchjeqHJxuuLfHY2fHe2o18/exec";

      let pet = 'Dog';
      let cleanKey = storyKey;
      if (storyKey.startsWith('cats_')) { pet = 'Cat'; cleanKey = storyKey.replace('cats_', ''); }
      else if (storyKey.startsWith('birds_')) { pet = 'Bird'; cleanKey = storyKey.replace('birds_', ''); }

      let category = 'Health';
      if (['foods', 'feeding'].includes(cleanKey)) category = 'Nutrition';
      else if (cleanKey.startsWith('training')) category = 'Training';
      else if (['drinking', 'exercise'].includes(cleanKey)) category = 'Everyday Care';

      let topic = cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1);

      const cleanTitle = (card.title || "").replace(/[^\w\s]/gi, '').trim().replace(/\s+/g, ' ');
      const surveyPath = `${pet} > ${category} > ${topic} > ${cleanTitle}`;

      const dataToSend = {
        action: "survey",
        lessonId: storyIdMap[storyKey] || storyKey,
        surveyPath: surveyPath,
        optionIndex: chosen
      };

      fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(dataToSend)
      }).catch(err => console.error("Error storing survey count:", err));


      const box = document.getElementById(`response-${cardIdx}`);
      if (box) {
        if (card.responses && card.responses[chosen]) {
          box.innerHTML = `${ICONS.check}<span>${card.responses[chosen]}</span>`;
          box.style.display = 'flex';
        } else if (card.type === 'quiz') {
          if (card.answer === chosen) {
            box.innerHTML = `${ICONS.check}<span>Correct! Great job.</span>`;
          } else {
            box.innerHTML = `<span>Not quite — review the previous cards to learn more!</span>`;
          }
          box.style.display = 'flex';
        } else if (card.type === 'poll' || card.type === 'survey') {
          box.innerHTML = `${ICONS.check}<span>Thanks for sharing!</span>`;
          box.style.display = 'flex';
        }
      }
    });
  });

  const reco = document.getElementById('recoCard');
  if (reco) {
    reco.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = CARDS[current];
      loadStory(card.recoStory);
    });
  }

  const replay = document.getElementById('replayBtn');
  if (replay) {
    replay.addEventListener('click', (e) => { e.stopPropagation(); loadStory('deworming'); });
  }

  document.querySelectorAll('.panel').forEach(panel => {
    panel.addEventListener('click', (e) => {
      if (e.target.closest('.opt, .reco-card, .replay-btn')) return;
      const rect = phone.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x > rect.width * 0.4) goTo(current + 1);
      else goTo(current - 1);
    });
  });
}

function setBarState(i) {
  CARDS.forEach((_, idx) => {
    const fill = document.getElementById('fill-' + idx);
    fill.style.width = (idx <= i) ? '100%' : '0%';
  });
}

let autoAdvanceTimer = null;
const AUTO_ADVANCE_MS = 30000;

// Restarts the 30-second auto-advance countdown. Called on every slide
// change (manual tap/swipe/arrow OR automatic), so a manual nav always
// gives the reader a fresh 30 seconds before it moves on again.
function resetAutoAdvance() {
  if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
  autoAdvanceTimer = setTimeout(() => {
    const next = (current + 1 >= CARDS.length) ? 0 : current + 1;
    goTo(next);
  }, AUTO_ADVANCE_MS);
}

function goTo(i) {
  if (i < 0) i = 0;
  if (i >= CARDS.length) i = CARDS.length - 1;
  showSlide(i);
}

function showSlide(i) {
  document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
  document.getElementById('slide-' + i).classList.add('active');
  current = i;
  setBarState(i);
  resetAutoAdvance();
}

function loadStory(key) {
  storyKey = key;
  CARDS = STORIES[key].cards;
  storyMeta.textContent = STORIES[key].meta;
  Object.keys(surveyAnswered).forEach(k => delete surveyAnswered[k]);
  buildBars();
  buildSlides();
  attachHandlers();
  goTo(0);
}

document.getElementById('navRight').addEventListener('click', () => goTo(current + 1));
document.getElementById('navLeft').addEventListener('click', () => goTo(current - 1));

const storyIdMap = {
  'vaccinations': 'DOG-L0001',
  'deworming': 'DOG-L0002',
  'signs': 'DOG-L0003',
  'prevention': 'DOG-L0004',
  'foods': 'DOG-L0005',
  'feeding': 'DOG-L0006',
  'drinking': 'DOG-L0013',
  'exercise': 'DOG-L0014',
  'trainingEarly': 'DOG-L0007',
  'trainingPositive': 'DOG-L0008',
  'trainingSit': 'DOG-L0009',
  'trainingStay': 'DOG-L0010',
  'trainingCome': 'DOG-L0011',
  'trainingPotty': 'DOG-L0012',
  'cats_vaccinations': 'CAT-L0001',
  'cats_deworming': 'CAT-L0002',
  'cats_signs': 'CAT-L0003',
  'cats_prevention': 'CAT-L0004',
  'cats_foods': 'CAT-L0005',
  'cats_feeding': 'CAT-L0006',
  'cats_drinking': 'CAT-L0007',
  'birds_checkups': 'BIRD-L0001',
  'birds_feeding': 'BIRD-L0002'
};

document.getElementById('shareBtn').addEventListener('click', () => {
  const sId = new URLSearchParams(window.location.search).get('story') || '101';
  const shareStoryIdMap = {
    'vaccinations': 'DOG-L0001',
    'deworming': 'DOG-L0002',
    'signs': 'DOG-L0003',
    'prevention': 'DOG-L0004',
    'foods': 'DOG-L0005',
    'feeding': 'DOG-L0006',
    'drinking': 'DOG-L0013',
    'exercise': 'DOG-L0014',
    'trainingEarly': 'DOG-L0007',
    'trainingPositive': 'DOG-L0008',
    'trainingSit': 'DOG-L0009',
    'trainingStay': 'DOG-L0010',
    'trainingCome': 'DOG-L0011',
    'trainingPotty': 'DOG-L0012',
    'cats_vaccinations': 'CAT-L0001',
    'cats_deworming': 'CAT-L0002',
    'cats_signs': 'CAT-L0003',
    'cats_prevention': 'CAT-L0004',
    'cats_foods': 'CAT-L0005',
    'cats_feeding': 'CAT-L0006',
    'cats_drinking': 'CAT-L0007',
    'birds_checkups': 'BIRD-L0001',
    'birds_feeding': 'BIRD-L0002'
  };
  const numericId = shareStoryIdMap[sId] || sId;
  const shareUrl = window.location.origin + '/pet-parent-academy/blogs/' + numericId;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Copied to clipboard!');
    }).catch(() => {
      prompt('Copy this link to share the story:', shareUrl);
    });
  } else {
    const textArea = document.createElement('textarea');
    textArea.value = shareUrl;
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      alert('Copied to clipboard!');
    } catch (err) {
      prompt('Copy this link to share the story:', shareUrl);
    }
    document.body.removeChild(textArea);
  }
});


function fallbackCopyTextToClipboard(text) {
  var textArea = document.createElement("textarea");
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    if (successful) {
      showToast('Link copied to clipboard');
    }
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}

function showToast(message) {
  let toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = 'rgba(0,0,0,0.8)';
  toast.style.color = 'white';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '5px';
  toast.style.zIndex = '9999';
  toast.style.fontFamily = 'sans-serif';
  toast.style.fontSize = '14px';
  document.body.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 2000);
}

document.getElementById('closeBtn').addEventListener('click', () => {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'petolife-story-close' }, '*');
  } else {
    loadStory('vaccinations');
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') goTo(current + 1);
  if (e.key === 'ArrowLeft') goTo(current - 1);
});

// Swipe navigation (touch) — in addition to arrows/keys/auto-advance.
let touchStartX = null;
phone.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
phone.addEventListener('touchend', (e) => {
  if (touchStartX === null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  const SWIPE_THRESHOLD = 40;
  if (Math.abs(dx) > SWIPE_THRESHOLD) {
    if (dx < 0) goTo(current + 1); else goTo(current - 1);
  }
  touchStartX = null;
}, { passive: true });

buildBars();
buildSlides();
attachHandlers();
goTo(0);
