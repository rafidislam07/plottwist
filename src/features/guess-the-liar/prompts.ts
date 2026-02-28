export type PromptPair = {
  generalQuestion: string;
  imposterQuestion: string;
};

export const GUESS_THE_LIAR_PROMPTS: PromptPair[] = [
  {
    generalQuestion: "What is your favorite beach destination?",
    imposterQuestion: "What is your favorite mountain destination?",
  },
  {
    generalQuestion: "What is the best pizza topping?",
    imposterQuestion: "What is the best burger topping?",
  },
  {
    generalQuestion: "Which app do you open first in the morning?",
    imposterQuestion: "Which app do you open last before bed?",
  },
  {
    generalQuestion: "What is the hardest class you took in school?",
    imposterQuestion: "What is the easiest class you took in school?",
  },
  {
    generalQuestion: "What snack disappears fastest at parties?",
    imposterQuestion: "What drink disappears fastest at parties?",
  },
  {
    generalQuestion: "What movie do you rewatch the most?",
    imposterQuestion: "What TV show do you rewatch the most?",
  },
  {
    generalQuestion: "Which city would you live in for one year?",
    imposterQuestion: "Which country would you live in for one year?",
  },
  {
    generalQuestion: "What is your go-to rainy day activity?",
    imposterQuestion: "What is your go-to sunny day activity?",
  },
  {
    generalQuestion: "What is the first thing you do on vacation?",
    imposterQuestion: "What is the last thing you do before leaving vacation?",
  },
  {
    generalQuestion: "Which food should every wedding have?",
    imposterQuestion: "Which dessert should every wedding have?",
  },
];
