import type { Playbook } from './types';

export const MOCK_PLAYS: Playbook[] = [
    {
        id: "1",
        title: "Romeo and Juliet",
        author: "William Shakespeare",
        year: 1597,
        genre: "Tragedy",
        description: "A tragic love story between two young lovers from feuding families.",
        characters: [
            { id: "c1", name: "Romeo", description: "Son of Montague", isFavorite: true, lastSelected: true, completionRate: 45 },
            { id: "c2", name: "Juliet", description: "Daughter of Capulet" },
            { id: "c3", name: "Mercutio", description: "Kinsman to the Prince and friend to Romeo" },
            { id: "c4", name: "Nurse", description: "Juliet's nurse" },
        ],
        acts: [
            {
                id: "a1",
                title: "Act 1",
                scenes: [
                    {
                        id: "s1-1",
                        title: "Scene 1: A public place",
                        lines: [
                            { id: "l1-1-1", characterId: "c1", text: "Is the day so young?", type: "dialogue" },
                            { id: "l1-1-2", characterId: "c3", text: "But new struck nine.", type: "dialogue" },
                            { id: "l1-1-3", characterId: "c1", text: "Ay me! sad hours seem long.", type: "dialogue" },
                            { id: "l1-1-4", characterId: "c3", text: "Was that my father that went hence so fast?", type: "dialogue" },
                            { id: "l1-1-5", characterId: "c1", text: "It was. What sadness lengthens Romeo's hours?", type: "dialogue" },
                        ],
                    },
                    {
                        id: "s1-2",
                        title: "Scene 2: A street",
                        lines: [
                            { id: "l1-2-1", characterId: "c1", text: "But soft! What light through yonder window breaks?", type: "dialogue" },
                            { id: "l1-2-2", characterId: "c1", text: "It is the east, and Juliet is the sun.", type: "dialogue" },
                            { id: "l1-2-3", characterId: "c2", text: "O Romeo, Romeo! wherefore art thou Romeo?", type: "dialogue" },
                            // Added extended Romeo monologue (public domain) as consecutive lines to form a long paragraph in book view
                            { id: "l1-2-4", characterId: "c1", text: "Arise, fair sun, and kill the envious moon, Who is already sick and pale with grief.", type: "dialogue" },
                            { id: "l1-2-5", characterId: "c1", text: "That thou her maid art far more fair than she: Be not her maid, since she is envious.", type: "dialogue" },
                            { id: "l1-2-6", characterId: "c1", text: "Her vestal livery is but sick and green And none but fools do wear it; cast it off.", type: "dialogue" },
                            { id: "l1-2-7", characterId: "c1", text: "It is my lady, O, it is my love! O, that she knew she were!", type: "dialogue" },
                            { id: "l1-2-8", characterId: "c1", text: "She speaks yet she says nothing: what of that? Her eye discourses; I will answer it.", type: "dialogue" },
                            { id: "l1-2-9", characterId: "c1", text: "I am too bold, 'tis not to me she speaks: Two of the fairest stars in all the heaven.", type: "dialogue" },
                            { id: "l1-2-10", characterId: "c1", text: "Having some business, do entreat her eyes To twinkle in their spheres till they return.", type: "dialogue" },
                            { id: "l1-2-11", characterId: "c1", text: "What if her eyes were there, they in her head? The brightness of her cheek would shame those stars.", type: "dialogue" },
                            { id: "l1-2-12", characterId: "c1", text: "As daylight doth a lamp; her eyes in heaven Would through the airy region stream so bright.", type: "dialogue" },
                        ],
                    },
                    {
                        id: "s1-3",
                        title: "Scene 3: Capulet's house",
                        lines: [
                            { id: "l1-3-1", characterId: "c4", text: "Even or odd, of all days in the year.", type: "dialogue" },
                            { id: "l1-3-2", characterId: "c2", text: "How now! who calls?", type: "dialogue" },
                            { id: "l1-3-3", characterId: "c4", text: "Your mother.", type: "dialogue" },
                        ],
                    },
                ],
            },
            {
                id: "a2",
                title: "Act 2",
                scenes: [
                    {
                        id: "s2-1",
                        title: "Scene 1: Capulet's orchard",
                        lines: [
                            { id: "l2-1-1", characterId: "c1", text: "He jests at scars that never felt a wound.", type: "dialogue" },
                            { id: "l2-1-2", characterId: "c2", text: "But, soft! what light through yonder window breaks?", type: "dialogue" },
                            { id: "l2-1-3", characterId: "c1", text: "O, speak again, bright angel!", type: "dialogue" },
                        ],
                    },
                    {
                        id: "s2-2",
                        title: "Scene 2: The balcony",
                        lines: [
                            { id: "l2-2-1", characterId: "c2", text: "Three words, dear Romeo, and good night indeed.", type: "dialogue" },
                            { id: "l2-2-2", characterId: "c1", text: "A thousand times good night!", type: "dialogue" },
                            { id: "l2-2-3", characterId: "c2", text: "A thousand times the worse, to want thy light.", type: "dialogue" },
                            { id: "l2-2-4", characterId: "c1", text: "Love goes toward love, as schoolboys from their books.", type: "dialogue" },
                        ],
                    },
                    {
                        id: "s2-3",
                        title: "Scene 3: Friar Laurence's cell",
                        lines: [
                            { id: "l2-3-1", characterId: "c1", text: "Good morrow, father.", type: "dialogue" },
                            { id: "l2-3-2", characterId: "c3", text: "Benedicite! What early tongue so sweet saluteth me?", type: "dialogue" },
                        ],
                    },
                ],
            },
            {
                id: "a3",
                title: "Act 3",
                scenes: [
                    {
                        id: "s3-1",
                        title: "Scene 1: A public place",
                        lines: [
                            { id: "l3-1-1", characterId: "c3", text: "I pray thee, good Mercutio, let's retire.", type: "dialogue" },
                            { id: "l3-1-2", characterId: "c1", text: "Alive, in triumph! and Mercutio slain!", type: "dialogue" },
                            { id: "l3-1-3", characterId: "c3", text: "A plague o' both your houses!", type: "dialogue" },
                        ],
                    },
                    {
                        id: "s3-2",
                        title: "Scene 2: Capulet's orchard",
                        lines: [
                            { id: "l3-2-1", characterId: "c2", text: "Gallop apace, you fiery-footed steeds.", type: "dialogue" },
                            { id: "l3-2-2", characterId: "c4", text: "Ah, weraday! he's dead, he's dead, he's dead!", type: "dialogue" },
                            { id: "l3-2-3", characterId: "c2", text: "Hath Romeo slain himself?", type: "dialogue" },
                        ],
                    },
                    {
                        id: "s3-3",
                        title: "Scene 3: Friar Laurence's cell",
                        lines: [
                            { id: "l3-3-1", characterId: "c1", text: "Father, what news? what is the prince's doom?", type: "dialogue" },
                            { id: "l3-3-2", characterId: "c4", text: "O, she says nothing, sir, but weeps and weeps.", type: "dialogue" },
                        ],
                    },
                ],
            },
            {
                id: "a4",
                title: "Act 4",
                scenes: [
                    {
                        id: "s4-1",
                        title: "Scene 1: Friar Laurence's cell",
                        lines: [
                            { id: "l4-1-1", characterId: "c2", text: "O shut the door! and when thou hast done so, come weep with me.", type: "dialogue" },
                            { id: "l4-1-2", characterId: "c1", text: "I do spy a kind of hope.", type: "dialogue" },
                        ],
                    },
                    {
                        id: "s4-2",
                        title: "Scene 2: Hall in Capulet's house",
                        lines: [
                            { id: "l4-2-1", characterId: "c2", text: "I met the youthful lord at Laurence' cell.", type: "dialogue" },
                            { id: "l4-2-2", characterId: "c4", text: "Go, you cot-quean, go, get you to bed.", type: "dialogue" },
                        ],
                    },
                    {
                        id: "s4-3",
                        title: "Scene 3: Juliet's chamber",
                        lines: [
                            { id: "l4-3-1", characterId: "c2", text: "Farewell! God knows when we shall meet again.", type: "dialogue" },
                            { id: "l4-3-2", characterId: "c4", text: "What, are you busy, ho? need you my help?", type: "dialogue" },
                            { id: "l4-3-3", characterId: "c2", text: "Romeo, I come! this do I drink to thee.", type: "dialogue" },
                        ],
                    },
                ],
            },
            {
                id: "a5",
                title: "Act 5",
                scenes: [
                    {
                        id: "s5-1",
                        title: "Scene 1: Mantua, a street",
                        lines: [
                            { id: "l5-1-1", characterId: "c1", text: "If I may trust the flattering truth of sleep.", type: "dialogue" },
                            { id: "l5-1-2", characterId: "c1", text: "Is it even so? then I defy you, stars!", type: "dialogue" },
                        ],
                    },
                    {
                        id: "s5-2",
                        title: "Scene 2: Friar Laurence's cell",
                        lines: [
                            { id: "l5-2-1", characterId: "c3", text: "I could not send it,--here it is again.", type: "dialogue" },
                            { id: "l5-2-2", characterId: "c1", text: "Unhappy fortune!", type: "dialogue" },
                        ],
                    },
                    {
                        id: "s5-3",
                        title: "Scene 3: A churchyard",
                        lines: [
                            { id: "l5-3-1", characterId: "c1", text: "Here's to my love! O true apothecary! Thy drugs are quick.", type: "dialogue" },
                            { id: "l5-3-2", characterId: "c2", text: "What's here? a cup, closed in my true love's hand?", type: "dialogue" },
                            { id: "l5-3-3", characterId: "c2", text: "O happy dagger! This is thy sheath; there rust, and let me die.", type: "dialogue" },
                            { id: "l5-3-4", characterId: "c4", text: "O woe! O woful, woful, woful day!", type: "dialogue" },
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: "2",
        title: "The Importance of Being Earnest",
        author: "Oscar Wilde",
        year: 1895,
        genre: "Comedy",
        description: "A farcical comedy in which the protagonists maintain fictitious personae to escape burdensome social obligations.",
        characters: [
            { id: "c5", name: "Jack Worthing", description: "A young gentleman" },
            { id: "c6", name: "Algernon Moncrieff", description: "A young gentleman" },
        ],
        acts: [],
    },
    {
        id: "3",
        title: "Cyrano de Bergerac",
        author: "Edmond Rostand",
        year: 1897,
        genre: "Romance",
        description: "A cadet in the French Army, a braggart and fearsome sword-fighter, but with a grotesquely large nose.",
        // Marked as fully completed for all characters in fake data
        characters: [
            { id: "cy1", name: "Cyrano", description: "Poet and swordsman", completionRate: 100, lastSelected: true },
            { id: "cy2", name: "Roxane", description: "Cousin of Cyrano", completionRate: 100 },
            { id: "cy3", name: "Christian", description: "A handsome cadet", completionRate: 100 },
            { id: "cy4", name: "Comte de Guiche", description: "A nobleman", completionRate: 100 },
        ],
        acts: [
            {
                id: "cy-a1",
                title: "Acte unique (démo)",
                scenes: [
                    {
                        id: "cy-s1",
                        title: "Scène 1: Une place à Paris",
                        lines: [
                            { id: "cy-l1", characterId: "cy1", text: "Moi, c'est mon panache que je défends.", type: "dialogue" },
                            { id: "cy-l2", characterId: "cy2", text: "Je n'aime que l'esprit, noble et véritable.", type: "dialogue" },
                            { id: "cy-l3", characterId: "cy3", text: "Je voudrais des mots pour mériter son cœur.", type: "dialogue" },
                            { id: "cy-l4", characterId: "cy4", text: "La stratégie commande, l'amour attendra.", type: "dialogue" },
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: "4",
        title: "Une entrée fracassante",
        author: "Jean-Pierre Martinez",
        year: 2025,
        genre: "Comédie",
        description: "Deux personnages entrent avec des déambulateurs pour réaliser une entrée fracassante, mais à leur manière...",
        characters: [
            { id: "f1", name: "Un", description: "Premier personnage" },
            { id: "f2", name: "Deux", description: "Second personnage" },
        ],
        acts: [
            {
                id: "fa1",
                title: "Acte 1",
                scenes: [
                    {
                        id: "fs1-1",
                        title: "Scène 1",
                        lines: [
                            { id: "fl1", text: "La scène est vide. Musique rythmée évoquant un film d'action.", type: "stage_direction" },
                            { id: "fl2", text: "Un personnage entre en marchant lentement avec un déambulateur.", type: "stage_direction" },
                            { id: "fl3", text: "Quand il a atteint le milieu de la scène, un autre personnage entre, également avec un déambulateur, et l’interpelle.", type: "stage_direction" },
                            { id: "fl4", characterId: "f1", text: "Eh ! Attends-moi !", type: "dialogue" },
                            { id: "fl5", characterId: "f2", text: "Quoi ?", type: "dialogue" },
                            { id: "fl6", characterId: "f1", text: "Attends-moi, je te dis !", type: "dialogue" },
                            { id: "fl7", characterId: "f2", text: "Je ne fais que ça, de t’attendre.", type: "dialogue" },
                            { id: "fl8", characterId: "f1", text: "Si tu allais moins vite, aussi.", type: "dialogue" },
                            { id: "fl9", characterId: "f2", text: "Le metteur en scène nous a dit : une entrée fracassante.", type: "dialogue" },
                            { id: "fl10", characterId: "f1", text: "Bon...", type: "dialogue" },
                            { id: "fl11", characterId: "f1", text: "Il accélère soudain et passe devant l’autre, avant de reprendre son rythme de tortue.", type: "stage_direction" },
                            { id: "fl12", characterId: "f2", text: "Qu’est-ce qui te prend ?", type: "dialogue" },
                            { id: "fl13", characterId: "f1", text: "Tu m’as dit de me dépêcher.", type: "dialogue" },
                            { id: "fl14", characterId: "f2", text: "Mais je ne t’ai pas dit de passer devant moi !", type: "dialogue" },
                            { id: "fl15", characterId: "f1", text: "Eh ben maintenant... rattrape-moi si tu peux. Une entrée fracassante...", type: "dialogue" },
                            { id: "fl16", characterId: "f1", text: "Il continue à marcher lentement jusqu’à sortir de l’autre côté de la scène.", type: "stage_direction" },
                            { id: "fl17", characterId: "f2", text: "Attends-moi... Attends-moi, je te dis ! Il n’a pas dit une sortie fracassante...", type: "dialogue" },
                            { id: "fl18", characterId: "f2", text: "Il se hâte lentement et sort à son tour.", type: "stage_direction" },
                            { id: "fl19", text: "Noir.", type: "stage_direction" },
                        ],
                    },
                ],
            },
        ],
    },
]
