class OverworldMap {
    constructor(config) {
      this.overworld = null;
      this.gameObjects = {};
      this.configObjects = config.configObjects;

      this.cutsceneSpaces = config.cutsceneSpaces || {};
      this.walls = config.walls || {};
  
      this.lowerImage = new Image();
      this.lowerImage.src = config.lowerSrc;
  
      this.upperImage = new Image();
      this.upperImage.src = config.upperSrc;

      this.isCutscenePlaying = false;
      this.isPaused = false;
    }
  
    drawLowerImage(ctx, cameraPerson) {
      ctx.drawImage(
        this.lowerImage,
        utils.withGrid(10.5) - cameraPerson.x, 
        utils.withGrid(6) - cameraPerson.y
        )
    }
  
    drawUpperImage(ctx, cameraPerson) {
      ctx.drawImage(
        this.upperImage, 
        utils.withGrid(10.5) - cameraPerson.x, 
        utils.withGrid(6) - cameraPerson.y
      )
    } 
  
    isSpaceTaken(currentX, currentY, direction) {
      const {x,y} = utils.nextPosition(currentX, currentY, direction);
      if(this.walls[`${x},${y}`]){
        return true;
      }
      return Object.values(this.gameObjects).find(obj => {
        if(obj.x === x && obj.y === y) {return true};
        if(obj.intentPosition && obj.intentPosition[0] === x && obj.intentPosition[1] === y) {
          return true;
        }
        return false;
      })
    }
  
    mountObjects() {
      Object.keys(this.configObjects).forEach(key => {

        let object = this.configObjects[key];
        object.id = key;

        let instance;
        if(object.type === "Person"){
          instance = new Person(object);
        }
        if(object.type === "HorseSpawner"){
          instance = new HorseSpawner(object);
        }
        if(object.type === "Apple"){
          instance = new Apple(object);
        }
        this.gameObjects[key] = instance;
        this.gameObjects[key].id = key;
        instance.mount(this);
      })
    }

    async startCutscene(events){
      this.isCutscenePlaying = true;
      //Start
      for(let i = 0; i < events.length; i++){
        const eventHandler = new OverworldEvent({
          event: events[i],
          map: this,
        })
        const result = await eventHandler.init();
        if(result === "LOST_BATTLE"){
          break;
        }
      }
      this.isCutscenePlaying = false;
      //Reset NPCs to resume behavior
      //Object.values(this.gameObjects).forEach(object => object.doBehaviorEvent(this));
    }

    checkForActionCutscene() {
      const hero = this.gameObjects["hero"];
      const nextCoords = utils.nextPosition(hero.x, hero.y, hero.direction);
      const match = Object.values(this.gameObjects).find(object => {
        return `${object.x},${object.y}` === `${nextCoords.x},${nextCoords.y}`
      });
      if(!this.isCutscenePlaying && match && match.talking.length) {

        const relevantScenario = match.talking.find(scenario => {
          return (scenario.required || []).every(sf => {
            return playerState.storyFlags[sf]
          })
        })

        relevantScenario && this.startCutscene(relevantScenario.events);
      }
    }

    checkForFootstepCutscene() {
      const hero = this.gameObjects["hero"];
      const match = this.cutsceneSpaces[ `${hero.x},${hero.y}` ];
      if(!this.isCutscenePlaying && match) {
        this.startCutscene(match[0].events);
      }
    }
  }

window.OverworldMaps = {
    StartingMap: {
      id: "StartingMap",
        lowerSrc: "/images/maps/StreetLower.png",
        upperSrc: "images/maps/StreetUpper.png",
        configObjects: {
            hero: {
              type: "Person",
              isPlayerControlled: true,
              x: utils.withGrid(),
              y: utils.withGrid(10),
              src: "/images/characters/people/hero.png",
            },
            npcA: {
              type: "Person",
              x: utils.withGrid(3),
              y: utils.withGrid(9),
              src: "/images/characters/people/npc1.png",
              behaviorLoop: [
                { type: "stand", direction: "left", time: 1800},
                { type: "stand", direction: "down", time: 1800 },
                { type: "stand", direction: "right", time: 1400 },
                { type: "stand", direction: "down", time: 1300 },
              ],
              talking: [
                {
                  required: ["HEALED_ELORA"],
                  events: [
                    { type: "textMessage", text: "You're strong, but you won't get very far with just one horse.", faceHero: "npcA" },
                    { type: "textMessage", text: "Have you seen an ancient pedestal yet? Upon it rests a mysterious egg. Nobody has been able to open them though...", faceHero: "npcA" },
                  ]
                },
                {
                  required: ["BATTLED_ELORA"],
                  events: [
                    { type: "textMessage", text: "You're stronger than you look! I will heal up Lucky for you.", faceHero: "npcA" },
                    { type: "healHorsesHp" },
                    { type: "addStoryFlag", flag: "HEALED_ELORA" },
                  ]
                },
                {
                  events: [
                    { type: "textMessage", text: "Welcome, traveler!", faceHero:"npcA" },
                    { type: "textMessage", text: "You've arrived just in time for our enchanted battles. Are you here to participate?", faceHero:"npcA" },
                    { type: "textMessage", text: "You must be! I see you already have your very own horse.", faceHero:"npcA" },
                    { type: "textMessage", text: "Well, I won't keep you too long, but considering you've got a horse of your own...", faceHero:"npcA" },
                    { type: "battle", enemyId: "elora" },
                    { type: "addStoryFlag", flag: "BATTLED_ELORA" },
                  ]
                }
              ]
            },
            npc3: {
              //chapter 1 Roderick - intro 
              type: "Person",
              x: utils.withGrid(14),//changed position
              y: utils.withGrid(8),
              src: "/images/characters/people/npc3.png",
              behaviorLoop: [
                { type: "stand", direction: "left", time: 1800},
                { type: "stand", direction: "down", time: 1800 },
                { type: "stand", direction: "right", time: 1400 },
                { type: "stand", direction: "down", time: 1300 },
              ],
              talking: [
                {
                  required: ["HEALED_ELORA"],
                  events: [
                   // { type: "textMessage", text: "You're strong, but you can always be better. Try battling and race your horse to improve.", faceHero: "npc3" },
                   //  { type: "textMessage", text: "Good luck, young one!", faceHero: "npc3" },
                  ]
                },
                {
                  required: ["BATTLED_ELORA"],
                  events: [
                   // { type: "textMessage", text: "I've been watching you, young one. You've got potential.", faceHero: "npc3" },
                   // { type: "healHorsesHp" },
                   // { type: "addStoryFlag", flag: "HEALED_ELORA" },
                  ]
                },
                {
                  events: [
                    { type: "textMessage", text: "Welcome, My name is Roderick!", faceHero:"npc3" },
                    { type: "textMessage", text: "I've been watching you. You may have potential...", faceHero:"npc3" },
                    { type: "textMessage", text: "You're strong, but you can always be better. Try battling and race your horse to improve.", faceHero:"npc3" },
                    { type: "textMessage", text: "Good luck on your journey young one!", faceHero:"npc3" },
                //    { type: "battle", enemyId: "elora" }, //may need to be changed 
                //   { type: "addStoryFlag", flag: "BATTLED_ELORA" },
                  ]
                }
              ]
        },
        },
        walls: {
          [utils.asGridCoords(-1,8)] : true,
          [utils.asGridCoords(-1,9)] : true,
          [utils.asGridCoords(-1,10)] : true,
          [utils.asGridCoords(-1,11)] : true,
          [utils.asGridCoords(0,12)] : true,
          [utils.asGridCoords(1,12)] : true,
          [utils.asGridCoords(2,12)] : true,
          [utils.asGridCoords(3,12)] : true,
          [utils.asGridCoords(4,12)] : true,
          [utils.asGridCoords(5,12)] : true,
          [utils.asGridCoords(6,12)] : true,
          [utils.asGridCoords(7,12)] : true,
          [utils.asGridCoords(8,12)] : true,
          [utils.asGridCoords(9,12)] : true,
          [utils.asGridCoords(10,12)] : true,
          [utils.asGridCoords(11,12)] : true,
          [utils.asGridCoords(12,12)] : true,
          [utils.asGridCoords(13,12)] : true,
          [utils.asGridCoords(14,12)] : true,
          [utils.asGridCoords(15,12)] : true,
          [utils.asGridCoords(16,12)] : true,
          [utils.asGridCoords(17,12)] : true,
          [utils.asGridCoords(18,12)] : true,
          [utils.asGridCoords(19,12)] : true,
          [utils.asGridCoords(0,6)] : true,
          [utils.asGridCoords(1,6)] : true,
          [utils.asGridCoords(2,6)] : true,
          [utils.asGridCoords(3,6)] : true,
          [utils.asGridCoords(4,6)] : true,
          [utils.asGridCoords(5,6)] : true,
          [utils.asGridCoords(6,6)] : true,
          [utils.asGridCoords(7,6)] : true,
          [utils.asGridCoords(8,6)] : true,
          [utils.asGridCoords(9,6)] : true,
          [utils.asGridCoords(10,6)] : true,
          [utils.asGridCoords(11,6)] : true,
          [utils.asGridCoords(12,6)] : true,
          [utils.asGridCoords(13,6)] : true,
          [utils.asGridCoords(14,6)] : true,
          [utils.asGridCoords(15,6)] : true,
          [utils.asGridCoords(16,6)] : true,
          [utils.asGridCoords(17,6)] : true,
          [utils.asGridCoords(18,6)] : true,
          [utils.asGridCoords(19,6)] : true,
          [utils.asGridCoords(20,8)] : true,
          [utils.asGridCoords(20,9)] : true,
          [utils.asGridCoords(20,11)] : true,
          [utils.asGridCoords(21,10)] : true,
        },
        cutsceneSpaces: {
          [utils.asGridCoords(20,10)]: [
            {
              //required: ["BATTLED_ELORA"],
              events: [
                { 
                  type: "changeMap", 
                  map: "RegionOne",
                  x: utils.withGrid(0),
                  y: utils.withGrid(10),
                  direction: "right"
                }
              ]
            }
          ]
        }
    },
    RegionOne: { //chapter2 
      id: "RegionOne",
      lowerSrc: "/images/maps/Region1Lower.png",
      upperSrc: "/images/maps/Region1Upper.png",
      configObjects: {
        hero: {
          type: "Person",
          isPlayerControlled: true,
          x: utils.withGrid(0),
          y: utils.withGrid(10),
          src: "/images/characters/people/hero.png",
        },
        elf1: {
          type: "Person",
          x: utils.withGrid(6),
          y: utils.withGrid(7),
          src: "/images/characters/people/elf1.png",
          behaviorLoop: [
            { type: "stand", direction: "right", time: 2800 },
            { type: "stand", direction: "down", time: 2400 },
            { type: "stand", direction: "up", time: 1300 },
          ],
          talking: [
            {
              required: ["BATTLED_FINROD"],
              events: [
                { type: "textMessage", text: "You have good technique, but you still have a lot to learn.", faceHero: "elf1" },
                { type: "textMessage", text: "Fear not! There is no shortage of battles to fight in this region!", faceHero: "elf1" },
              ]
            },
            {
              required: ["USED_HORSE_SPAWNER_R1"],
              events: [
                { type: "textMessage", text: "I see...you were able to open the magical egg...interesting.", faceHero: "elf1" },
                { type: "textMessage", text: "Why don't we put that new horse of yours to the test?!", faceHero: "elf1" },
                { type: "battle", enemyId: "finrod" },
                { type: "addStoryFlag", flag: "BATTLED_FINROD" },
              ]
            },
            {
              events: [
                { type: "textMessage", text: "Hello, traveler. Have you come to try and open the magical egg? Nobody has had any luck yet.", faceHero:"elf1" },
              ]
            }
          ]
        },
        horseSpawner: {
          type: "HorseSpawner",
          x: utils.withGrid(7),
          y: utils.withGrid(7),
          storyFlag: "USED_HORSE_SPAWNER_R1",
          horses: ["n006", "n003"]
      },
      guy5: {
        //orik - blacksmith 
        type: "Person",
        x: utils.withGrid(5),
        y: utils.withGrid(2),
        src: "/images/characters/people/guy5.png",
        behaviorLoop: [
          { type: "stand", direction: "right", time: 2800 },
          { type: "stand", direction: "down", time: 2400 },
          { type: "stand", direction: "up", time: 1300 },
        ],
        talking: [
          {
            required: ["BATTLED_FINROD"],
            events: [
       //       { type: "textMessage", text: "Hello young trainer, My name is Orik i'm the local blacksmith", faceHero: "guy5" },
       //       { type: "textMessage", text: "I can forge powerful gear for your horses.", faceHero: "guy5" },
            ]
          },
          {
            required: ["USED_HORSE_SPAWNER_R1"],
            events: [
          //    { type: "textMessage", text: "I see...you were able to open the magical egg...interesting.", faceHero: "guy5" },
          //    { type: "textMessage", text: "Why don't we put that new horse of yours to the test?!", faceHero: "guy5" },
          //    { type: "battle", enemyId: "finrod" },
          //    { type: "addStoryFlag", flag: "BATTLED_FINROD" },
            ]
          },
          {
            events: [
              { type: "textMessage", text: "Hello young trainer, My name is Orik i'm the local blacksmith", faceHero: "guy5" },
              { type: "textMessage", text: "I can forge powerful gear for your horses.", faceHero: "guy5" },
            ]////////add weapons stand...?
          }
        ]
      },

    },
    walls: {
      [utils.asGridCoords(-1,0)] : true,
      [utils.asGridCoords(-1,1)] : true,
      [utils.asGridCoords(-1,2)] : true,
      [utils.asGridCoords(-1,3)] : true,
      [utils.asGridCoords(-1,4)] : true,
      [utils.asGridCoords(-1,5)] : true,
      [utils.asGridCoords(-1,6)] : true,
      [utils.asGridCoords(-1,7)] : true,
      [utils.asGridCoords(-1,8)] : true,
      [utils.asGridCoords(-1,9)] : true,
      [utils.asGridCoords(-1,10)] : true,
      [utils.asGridCoords(-1,11)] : true,
      [utils.asGridCoords(-1,12)] : true,
      [utils.asGridCoords(1,4)] : true,
      [utils.asGridCoords(1,5)] : true,
      [utils.asGridCoords(0,0)] : true,
      [utils.asGridCoords(1,0)] : true,
      [utils.asGridCoords(2,0)] : true,
      [utils.asGridCoords(0,1)] : true,
      [utils.asGridCoords(1,1)] : true,
      [utils.asGridCoords(0,2)] : true,
      [utils.asGridCoords(1,2)] : true,
      [utils.asGridCoords(1,3)] : true,
      [utils.asGridCoords(1,4)] : true,
      [utils.asGridCoords(1,5)] : true,
      [utils.asGridCoords(1,6)] : true,
      [utils.asGridCoords(1,8)] : true,
      [utils.asGridCoords(1,2)] : true,
      [utils.asGridCoords(8,0)] : true,
      [utils.asGridCoords(8,1)] : true,
      [utils.asGridCoords(8,2)] : true,
      [utils.asGridCoords(8,3)] : true,
      [utils.asGridCoords(8,4)] : true,
      [utils.asGridCoords(8,5)] : true,
      [utils.asGridCoords(8,6)] : true,
      [utils.asGridCoords(8,7)] : true,
      [utils.asGridCoords(8,8)] : true,
      [utils.asGridCoords(8,9)] : true,
      [utils.asGridCoords(8,10)] : true,
      [utils.asGridCoords(8,11)] : true,
      [utils.asGridCoords(7,-1)] : true,
      [utils.asGridCoords(6,-1)] : true,
      [utils.asGridCoords(5,-1)] : true,
      [utils.asGridCoords(3,-1)] : true,
      [utils.asGridCoords(0,12)] : true,
      [utils.asGridCoords(1,12)] : true,
      [utils.asGridCoords(2,12)] : true,
      [utils.asGridCoords(3,12)] : true,
      [utils.asGridCoords(4,12)] : true,
      [utils.asGridCoords(5,12)] : true,
      [utils.asGridCoords(6,12)] : true,
      [utils.asGridCoords(7,12)] : true,
    },
    cutsceneSpaces: {
      [utils.asGridCoords(0,10)]: [
        {
          events: [
            { 
              type: "changeMap", 
              map: "StartingMap",
              x: utils.withGrid(20),
              y: utils.withGrid(10),
              direction: "left" 
            }
          ]
        }
      ],
      [utils.asGridCoords(7,10)]: [
        {
          events: [
            { 
              type: "changeMap", 
              map: "RegionTwo",
              x: utils.withGrid(0),
              y: utils.withGrid(14),
              direction: "right" 
            }
          ]
        }
      ],
      [utils.asGridCoords(4,0)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "RegionThree",
              x: utils.withGrid(10),
              y: utils.withGrid(19),
              direction: "up"
            }
          ]
        }
      ]
    }
  },
  RegionTwo: { //Chapter3 
    id: "RegionTwo",
    lowerSrc: "/images/maps/Region2Lower.png",
    upperSrc: "/images/maps/Region2Upper.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(1),
        y: utils.withGrid(14),
        src: "/images/characters/people/hero.png",
      },
      nurse1: {
        type: "Person",
        x: utils.withGrid(18),
        y: utils.withGrid(15),
        src: "/images/characters/people/nurse.png",
        talking: [
          {
            events: [
              { type: "textMessage", text: "Hello traveler. Equine nurse Lara at your service. I will heal your horses right up.", faceHero: "nurse1"},
              { type: "healHorsesHp" },
              { type: "textMessage", text: "Come back anytime!"}
            ]
          }
        ]
      },
      trainer1: {
        type: "Person",
        x: utils.withGrid(9),
        y: utils.withGrid(11),
        src: "/images/characters/people/trainer1.png",
        behaviorLoop: [
            { type: "walk", direction: "down", time: 2800 },
            { type: "stand", direction: "down", time: 2400 },
            { type: "walk", direction: "right", time: 2800 },
            { type: "stand", direction: "right", time: 2400 },
            { type: "walk", direction: "up", time: 1300 },
            { type: "stand", direction: "up", time: 1300 },
            { type: "walk", direction: "left", time: 1300 },
            { type: "stand", direction: "left", time: 1300 },
        ],
        talking: [
          {
            required: ["BATTLED_ROBERT"],
            events: [
              { type: "textMessage", text: "Well, that was quite a battle. I have to admit, you and your horse put up a decent fight." }
            ]
          },
          {
            events: [
              { type: "textMessage", text: "Prepare yourself for a lesson in style and skill. My horses are the epitome of greatness. You'll be eating my dust!", faceHero: "trainer1" },
              { type: "battle", enemyId: "robert" },
              { type: "addStoryFlag", flag: "BATTLED_ROBERT" },
            ]
          },
        ]
      }
    },
    walls: {
      [utils.asGridCoords(0,9)] : true,
      [utils.asGridCoords(0,10)] : true,
      [utils.asGridCoords(0,11)] : true,
      [utils.asGridCoords(0,12)] : true,
      [utils.asGridCoords(0,13)] : true,
      [utils.asGridCoords(0,15)] : true,
      [utils.asGridCoords(0,16)] : true,
      [utils.asGridCoords(0,17)] : true,
      [utils.asGridCoords(0,18)] : true,
      [utils.asGridCoords(0,11)] : true,
      [utils.asGridCoords(1,16)] : true,
      [utils.asGridCoords(2,16)] : true,
      [utils.asGridCoords(3,16)] : true,
      [utils.asGridCoords(4,16)] : true,
      [utils.asGridCoords(5,16)] : true,
      [utils.asGridCoords(6,16)] : true,
      [utils.asGridCoords(7,16)] : true,
      [utils.asGridCoords(8,16)] : true,
      [utils.asGridCoords(9,16)] : true,
      [utils.asGridCoords(10,16)] : true,
      [utils.asGridCoords(11,16)] : true,
      [utils.asGridCoords(11,17)] : true,
      [utils.asGridCoords(13,17)] : true,
      [utils.asGridCoords(12,18)] : true,
      [utils.asGridCoords(13,16)] : true,
      [utils.asGridCoords(14,16)] : true,
      [utils.asGridCoords(15,16)] : true,
      [utils.asGridCoords(16,16)] : true,
      [utils.asGridCoords(17,16)] : true,
      [utils.asGridCoords(18,16)] : true,
      [utils.asGridCoords(19,11)] : true,
      [utils.asGridCoords(19,12)] : true,
      [utils.asGridCoords(19,13)] : true,
      [utils.asGridCoords(19,14)] : true,
      [utils.asGridCoords(19,15)] : true,
      [utils.asGridCoords(18,10)] : true,
      [utils.asGridCoords(17,10)] : true,
      [utils.asGridCoords(16,9)] : true,
      [utils.asGridCoords(7,9)] : true,
      [utils.asGridCoords(4,12)] : true,
      [utils.asGridCoords(1,10)] : true,
      [utils.asGridCoords(2,10)] : true,
      [utils.asGridCoords(3,10)] : true,
      [utils.asGridCoords(4,10)] : true,
      [utils.asGridCoords(5,10)] : true,
      [utils.asGridCoords(6,10)] : true,
      [utils.asGridCoords(7,10)] : true,
      [utils.asGridCoords(8,8)] : true,
      [utils.asGridCoords(9,8)] : true,
      [utils.asGridCoords(10,8)] : true,
      [utils.asGridCoords(11,8)] : true,
      [utils.asGridCoords(12,8)] : true,
      [utils.asGridCoords(13,8)] : true,
      [utils.asGridCoords(15,8)] : true,
      [utils.asGridCoords(14,7)] : true,
      [utils.asGridCoords(-1,14)] : true,
    },
    cutsceneSpaces: {
      [utils.asGridCoords(0,14)]: [
        {
          events: [
            { 
              type: "changeMap", 
              map: "RegionOne",
              x: utils.withGrid(7),
              y: utils.withGrid(10),
              direction: "left" 
            }
          ]
        }
      ],
      [utils.asGridCoords(14,8)]: [
        {
          events: [
            { 
              type: "changeMap", 
              map: "RegionFour",
              x: utils.withGrid(10),
              y: utils.withGrid(15),
              direction: "up" 
            }
          ]
        }
      ]
    }
  },
  RegionThree: { //chapter 4 
    id: "RegionThree",
    lowerSrc: "/images/maps/Region3Lower.png",
    upperSrc: "/images/maps/Region3Upper.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(1),
        y: utils.withGrid(14),
        src: "/images/characters/people/hero.png",
      },
      farmer1 : {
        type: "Person",
        x: utils.withGrid(7),
        y: utils.withGrid(2),
        src: "/images/characters/people/farmer1.png",
        behaviorLoop: [
          { type: "walk", direction: "right", time: 2800 },
          { type: "walk", direction: "right", time: 2800 },
          { type: "walk", direction: "right", time: 2800 },
          { type: "walk", direction: "right", time: 2800 },
          { type: "walk", direction: "right", time: 2800 },
          { type: "walk", direction: "right", time: 2800 },
          { type: "stand", direction: "right", time: 3000 },
          { type: "walk", direction: "left", time: 2800 },
          { type: "walk", direction: "left", time: 2800 },
          { type: "walk", direction: "left", time: 2800 },
          { type: "walk", direction: "left", time: 2800 },
          { type: "walk", direction: "left", time: 2800 },
          { type: "walk", direction: "left", time: 2800 },
          { type: "stand", direction: "left", time: 3000 },
        ],
        talking: [
          {
            required: ["TALKED_FARMER1"],
            events: [
              { type: "textMessage", text: "Keep an eye out for more apples! They come in handy during battles.", faceHero: "farmer1" }
            ]
          },
          {
            events: [
              { type: "textMessage", text: "Howdy, traveler. Did you know you can find apples and carrots in these parts?", faceHero: "farmer1" },
              { type: "textMessage", text: "They won't do much for you, but your horse will love them.", faceHero: "farmer1"},
              { type: "textMessage", text: "Here's an apple for the road.", faceHero: "farmer1"},
              { type: "addItemToInventory", item: { actionId: "item_recoverHp", instanceId: "appleItem" } },
              { type: "addStoryFlag", flag: "TALKED_FARMER1" },

            ]
          }
        ]
      },
      trainer3: {
        type: "Person",
        x: utils.withGrid(4),
        y: utils.withGrid(11),
        src: "/images/characters/people/trainer3.png",
        behaviorLoop: [
          { type: "walk", direction: "down", time: 2800 },
          { type: "walk", direction: "down", time: 2800 },
          { type: "stand", direction: "down", time: 2800 },
          { type: "walk", direction: "up" , time: 2800},
          { type: "walk", direction: "up" , time: 2800},
          { type: "stand", direction: "up", time: 2800 },
        ],
        talking: [
          {
            required: ["BATTLED_SELENE"],
            events: [
              { type: "textMessage", text: "You have some strong horses. See you around sometime, maybe for a rematch!", faceHero: "trainer3" }
            ]
          },
          {
            events: [
              { type: "textMessage", text: "I've been waiting for someone to battle! Lets see if you can keep up with me.", faceHero: "trainer3"},
              { type: "battle", enemyId: "selene" },
              { type: "addStoryFlag", flag: "BATTLED_SELENE" },
            ]
          }
        ]
      },
      apple: {
        type: "Apple",
        id: "apple1",
        x: utils.withGrid(4),
        y: utils.withGrid(7),
        storyFlag: "COLLECTED_APPLE1"
      },
      apple2: {
        type: "Apple",
        id: "apple2",
        x: utils.withGrid(16),
        y: utils.withGrid(6),
        storyFlag: "COLLECTED_APPLE2"
      },
    },
    cutsceneSpaces: {
      [utils.asGridCoords(10,19)]: [
        {
          events: [
            { 
              type: "changeMap", 
              map: "RegionOne",
              x: utils.withGrid(4),
              y: utils.withGrid(0),
              direction: "down" 
            }
          ]
        }
      ],
      [utils.asGridCoords(19,9)]: [
        {
          events: [
            { 
              type: "changeMap", 
              map: "RegionFour",
              x: utils.withGrid(0),
              y: utils.withGrid(9),
              direction: "right" 
            }
          ]
        }
      ]
    },
    walls: {
      [utils.asGridCoords(0,5)] : true,
      [utils.asGridCoords(0,6)] : true,
      [utils.asGridCoords(0,7)] : true,
      [utils.asGridCoords(0,8)] : true,
      [utils.asGridCoords(0,9)] : true,
      [utils.asGridCoords(0,10)] : true,
      [utils.asGridCoords(0,11)] : true,
      [utils.asGridCoords(0,12)] : true,
      [utils.asGridCoords(0,13)] : true,
      [utils.asGridCoords(0,14)] : true,
      [utils.asGridCoords(0,15)] : true,
      [utils.asGridCoords(1,4)] : true,
      [utils.asGridCoords(2,5)] : true,
      [utils.asGridCoords(3,5)] : true,
      [utils.asGridCoords(4,4)] : true,
      [utils.asGridCoords(5,4)] : true,
      [utils.asGridCoords(5,3)] : true,
      [utils.asGridCoords(5,2)] : true,
      [utils.asGridCoords(5,1)] : true,
      [utils.asGridCoords(6,0)] : true,
      [utils.asGridCoords(7,0)] : true,
      [utils.asGridCoords(8,0)] : true,
      [utils.asGridCoords(9,0)] : true,
      [utils.asGridCoords(10,0)] : true,
      [utils.asGridCoords(11,0)] : true,
      [utils.asGridCoords(12,0)] : true,
      [utils.asGridCoords(13,0)] : true,
      [utils.asGridCoords(14,0)] : true,
      [utils.asGridCoords(15,1)] : true,
      [utils.asGridCoords(15,2)] : true,
      [utils.asGridCoords(15,3)] : true,
      [utils.asGridCoords(16,4)] : true,
      [utils.asGridCoords(17,4)] : true,
      [utils.asGridCoords(18,4)] : true,
      [utils.asGridCoords(19,5)] : true,
      [utils.asGridCoords(19,6)] : true,
      [utils.asGridCoords(19,7)] : true,
      [utils.asGridCoords(19,8)] : true,
      [utils.asGridCoords(19,10)] : true,
      [utils.asGridCoords(19,11)] : true,
      [utils.asGridCoords(19,12)] : true,
      [utils.asGridCoords(19,13)] : true,
      [utils.asGridCoords(19,14)] : true,
      [utils.asGridCoords(19,15)] : true,
      [utils.asGridCoords(20,9)] : true,
      [utils.asGridCoords(1,16)] : true,
      [utils.asGridCoords(2,16)] : true,
      [utils.asGridCoords(3,16)] : true,
      [utils.asGridCoords(4,16)] : true,
      [utils.asGridCoords(4,17)] : true,
      [utils.asGridCoords(4,18)] : true,
      [utils.asGridCoords(5,19)] : true,
      [utils.asGridCoords(6,19)] : true,
      [utils.asGridCoords(7,19)] : true,
      [utils.asGridCoords(8,19)] : true,
      [utils.asGridCoords(9,19)] : true,
      [utils.asGridCoords(11,19)] : true,
      [utils.asGridCoords(12,19)] : true,
      [utils.asGridCoords(13,19)] : true,
      [utils.asGridCoords(14,19)] : true,
      [utils.asGridCoords(15,19)] : true,
      [utils.asGridCoords(16,19)] : true,
      [utils.asGridCoords(10,20)] : true,
    }
  },
  
  RegionFour: { //chapter5 
    id: "RegionFour",
    lowerSrc: "/images/maps/Region4Lower.png",
    upperSrc: "/images/maps/Region4Upper.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(2),
        y: utils.withGrid(12),
        src: "/images/characters/people/hero.png",
      },
      trainer1: {
        type: "Person",
        x: utils.withGrid(5),
        y: utils.withGrid(8),
        src: "/images/characters/people/guy2.png",
        behaviorLoop: [ 
          { type: "walk", direction: "down", time: 2800 },
          { type: "walk", direction: "down", time: 2800 },
          { type: "stand", direction: "down", time: 2800 },
          { type: "walk", direction: "right", time: 2800 },
          { type: "walk", direction: "right", time: 2800 },
          { type: "stand", direction: "right", time: 2800 },
          { type: "walk", direction: "up" , time: 2800},
          { type: "walk", direction: "up" , time: 2800},
          { type: "stand", direction: "up", time: 2800 },
          { type: "walk", direction: "left" , time: 2800},
          { type: "walk", direction: "left" , time: 2800},
          { type: "stand", direction: "left", time: 2800 },
        ],
        talking: [
          {
            required: ["BATTLED_MARK"],
            events: [
              { type: "textMessage", text: "You are strong, but you're gonna need some better horses soon. I hope you can find some!", faceHero: "trainer1" }
            ]
          },
          {
            events: [
              { type: "textMessage", text: "Let's battle!", faceHero: "trainer1"},
              { type: "battle", enemyId: "mark" },
              { type: "addStoryFlag", flag: "BATTLED_MARK" },
            ]
          }
        ]
      },
      trainerA: {
        type: "Person",
        x: utils.withGrid(9),
        y: utils.withGrid(6),
        src: "/images/characters/people/guy6.png",
        behaviorLoop: [
          { type: "walk", direction: "up", time: 2800 },
          { type: "walk", direction: "down", time: 2800 },
          { type: "stand", direction: "down", time: 2800 },
          { type: "walk", direction: "right", time: 2800 },
          { type: "walk", direction: "right", time: 2800 },
          { type: "stand", direction: "right", time: 2800 },
          { type: "walk", direction: "up" , time: 2800},
          { type: "walk", direction: "up" , time: 2800},
          { type: "stand", direction: "up", time: 2800 },
          { type: "walk", direction: "left" , time: 2800},
          { type: "walk", direction: "left" , time: 2800},
          { type: "stand", direction: "left", time: 2800 },
        ],
        talking: [
          {
            required: ["BATTLED_MARK"],
            events: [
         //     { type: "textMessage", text: "You are strong, but you're gonna need some better horses soon. I hope you can find some!", faceHero: "trainer1" }
            ]
          },
          {
            ///add apple bucket code but with herbs
            events: [
              { type: "textMessage", text: "I'm Thaddeus, a reclusive herbalist with a keen interest in magical herbs.", faceHero: "trainerA"},
              { type: "textMessage", text: "I'm in need of a brave soul to go on a quest to fetch some rare herbs from the mountains.", faceHero: "trainerA"},
             // { type: "battle", enemyId: "mark" },
             // { type: "addStoryFlag", flag: "BATTLED_MARK" },
            ]
          }
        ]
      },

    },
    cutsceneSpaces: {
      [utils.asGridCoords(0,9)]: [
        {
          events: [
            { 
              type: "changeMap", 
              map: "RegionThree",
              x: utils.withGrid(19),
              y: utils.withGrid(9),
              direction: "left" 
            }
          ]
        }
      ],
      [utils.asGridCoords(10,15)]: [
        {
          events: [
            { 
              type: "changeMap", 
              map: "RegionTwo",
              x: utils.withGrid(14),
              y: utils.withGrid(8),
              direction: "down" 
            }
          ]
        }
      ],
      [utils.asGridCoords(15,9)]: [
        {
          events: [
            { 
              type: "changeMap", 
              map: "MainRegion1",
              x: utils.withGrid(0),
              y: utils.withGrid(15),
              direction: "right" 
            }
          ]
        }
      ]
    },
    walls: {
      [utils.asGridCoords(1,15)] : true,
      [utils.asGridCoords(2,15)] : true,
      [utils.asGridCoords(3,15)] : true,
      [utils.asGridCoords(4,15)] : true,
      [utils.asGridCoords(5,15)] : true,
      [utils.asGridCoords(6,15)] : true,
      [utils.asGridCoords(7,15)] : true,
      [utils.asGridCoords(8,15)] : true,
      [utils.asGridCoords(9,15)] : true,
      [utils.asGridCoords(10,16)] : true,
      [utils.asGridCoords(11,15)] : true,
      [utils.asGridCoords(12,15)] : true,
      [utils.asGridCoords(13,15)] : true,
      [utils.asGridCoords(14,15)] : true,
      [utils.asGridCoords(15,6)] : true,
      [utils.asGridCoords(15,7)] : true,
      [utils.asGridCoords(15,8)] : true,
      [utils.asGridCoords(16,9)] : true,
      [utils.asGridCoords(15,10)] : true,
      [utils.asGridCoords(15,11)] : true,
      [utils.asGridCoords(15,12)] : true,
      [utils.asGridCoords(15,13)] : true,
      [utils.asGridCoords(15,14)] : true,
      [utils.asGridCoords(0,5)] : true,
      [utils.asGridCoords(0,6)] : true,
      [utils.asGridCoords(0,7)] : true,
      [utils.asGridCoords(0,8)] : true,
      [utils.asGridCoords(-1,9)] : true,
      [utils.asGridCoords(0,10)] : true,
      [utils.asGridCoords(0,11)] : true,
      [utils.asGridCoords(0,12)] : true,
      [utils.asGridCoords(0,13)] : true,
      [utils.asGridCoords(0,14)] : true,
      [utils.asGridCoords(1,5)] : true,
      [utils.asGridCoords(2,5)] : true,
      [utils.asGridCoords(3,5)] : true,
      [utils.asGridCoords(5,5)] : true,
      [utils.asGridCoords(6,5)] : true,
      [utils.asGridCoords(7,5)] : true,
      [utils.asGridCoords(8,5)] : true,
      [utils.asGridCoords(9,5)] : true,
      [utils.asGridCoords(10,5)] : true,
      [utils.asGridCoords(11,5)] : true,
      [utils.asGridCoords(12,5)] : true,
      [utils.asGridCoords(13,5)] : true,
      [utils.asGridCoords(14,5)] : true,
    }
  },
  MainRegion1: {
    id: "MainRegion1",
    lowerSrc: "/images/maps/MainRegion1Lower.png",
    upperSrc: "/images/maps/MainRegion1Upper.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(7),
        y: utils.withGrid(6),
        src: "/images/characters/people/hero.png"
      },
      npcA: {
        type: "Person",
        x: utils.withGrid(13),
        y: utils.withGrid(8),
        src: "/images/characters/people/guy5.png",
        behaviorLoop: [
          { type: "stand", direction: "left", time: 1800},
          { type: "stand", direction: "down", time: 1800 },
          { type: "stand", direction: "right", time: 1400 },
          { type: "stand", direction: "down", time: 1300 },
        ],
        talking: [
          {
            required: ["BATTLED_DEREK"],
            events: [
              { type: "textMessage", text: "I wasn't expected that result, to be honest with you!", faceHero: "npcA" }
            ]
          },
          {
            events: [
              { type: "textMessage", text: "You need a strong fishing pole to catch trout!", faceHero:"npcA" },
              { type: "textMessage", text: "And an even stronger horse to beat me!", faceHero:"npcA" },
              { type: "battle", enemyId: "derek" },
              { type: "addStoryFlag", flag: "BATTLED_DEREK" },
            ]
          }
        ]
      },
      npcB: {
        type: "Person",
        x: utils.withGrid(9),
        y: utils.withGrid(12),
        src: "/images/characters/people/guy3.png",
        behaviorLoop: [
          { type: "stand", direction: "left", time: 1200},
          { type: "stand", direction: "down", time: 1200 },
          { type: "stand", direction: "right", time: 900 },
          { type: "stand", direction: "down", time: 1100 },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "I heard that there are unicorns in the hidden forest!", faceHero:"npcB" }
            ]
          }
        ]
      }
  },
  cutsceneSpaces: {
    [utils.asGridCoords(0,15)]: [
      {
        events: [
          { 
            type: "changeMap", 
            map: "RegionFour",
            x: utils.withGrid(15),
            y: utils.withGrid(9),
            direction: "left" 
          }
        ]
      }
    ],
    [utils.asGridCoords(19,15)]: [
      {
        events: [
          { 
            type: "changeMap", 
            map: "MainRegion2",
            x: utils.withGrid(0),
            y: utils.withGrid(16),
            direction: "right" 
          }
        ]
      }
    ]
  },
  walls: {

    // left walls
    [utils.asGridCoords(0,1)] : true,
    [utils.asGridCoords(0,2)] : true,
    [utils.asGridCoords(0,3)] : true,
    [utils.asGridCoords(0,4)] : true,
    [utils.asGridCoords(0,5)] : true,
    [utils.asGridCoords(0,6)] : true,
    [utils.asGridCoords(0,7)] : true,
    [utils.asGridCoords(0,8)] : true,
    [utils.asGridCoords(0,9)] : true,
    [utils.asGridCoords(0,10)] : true,
    [utils.asGridCoords(0,11)] : true,
    [utils.asGridCoords(0,12)] : true,
    [utils.asGridCoords(0,13)] : true,
    [utils.asGridCoords(0,14)] : true,
    // [utils.asGridCoords(0,15)] : true,
    [utils.asGridCoords(0,16)] : true,
    [utils.asGridCoords(0,17)] : true,
    [utils.asGridCoords(0,18)] : true,

    // bottom walls
    [utils.asGridCoords(1,16)] : true,
    [utils.asGridCoords(2,16)] : true,
    [utils.asGridCoords(3,16)] : true,
    [utils.asGridCoords(4,16)] : true,
    [utils.asGridCoords(5,16)] : true,
    [utils.asGridCoords(6,16)] : true,
    [utils.asGridCoords(7,16)] : true,
    [utils.asGridCoords(8,16)] : true,
    [utils.asGridCoords(9,16)] : true,
    [utils.asGridCoords(10,16)] : true,
    [utils.asGridCoords(11,16)] : true,
    [utils.asGridCoords(12,16)] : true,
    [utils.asGridCoords(13,16)] : true,
    [utils.asGridCoords(14,16)] : true,
    [utils.asGridCoords(15,16)] : true,
    [utils.asGridCoords(16,16)] : true,
    [utils.asGridCoords(17,16)] : true,
    [utils.asGridCoords(18,16)] : true,
    [utils.asGridCoords(19,16)] : true,

    // top walls
    [utils.asGridCoords(1,1)] : true,
    [utils.asGridCoords(2,1)] : true,
    [utils.asGridCoords(3,1)] : true,
    [utils.asGridCoords(4,1)] : true,
    [utils.asGridCoords(5,1)] : true,
    [utils.asGridCoords(6,1)] : true,
    [utils.asGridCoords(7,1)] : true,
    [utils.asGridCoords(8,1)] : true,
    [utils.asGridCoords(9,1)] : true,
    [utils.asGridCoords(10,0)] : true,
    [utils.asGridCoords(11,1)] : true,
    [utils.asGridCoords(12,1)] : true,
    [utils.asGridCoords(13,1)] : true,
    [utils.asGridCoords(14,1)] : true,
    [utils.asGridCoords(15,1)] : true,
    [utils.asGridCoords(16,1)] : true,
    [utils.asGridCoords(17,1)] : true,
    [utils.asGridCoords(18,1)] : true,
    [utils.asGridCoords(19,1)] : true,

    [utils.asGridCoords(19,0)] : true,
    [utils.asGridCoords(19,1)] : true,
    [utils.asGridCoords(19,2)] : true,
    [utils.asGridCoords(19,3)] : true,
    [utils.asGridCoords(19,4)] : true,
    [utils.asGridCoords(19,5)] : true,
    [utils.asGridCoords(19,6)] : true,
    [utils.asGridCoords(19,7)] : true,
    [utils.asGridCoords(19,8)] : true,
    [utils.asGridCoords(19,9)] : true,
    [utils.asGridCoords(19,10)] : true,
    [utils.asGridCoords(19,11)] : true,
    [utils.asGridCoords(19,12)] : true,
    [utils.asGridCoords(19,13)] : true,
    [utils.asGridCoords(19,14)] : true,
    // [utils.asGridCoords(19,15)] : true,
    

    // path walls
    [utils.asGridCoords(8,11)] : true,
    [utils.asGridCoords(8,10)] : true,
    [utils.asGridCoords(8,9)] : true,
    [utils.asGridCoords(8,8)] : true,
    [utils.asGridCoords(8,7)] : true,
    [utils.asGridCoords(8,6)] : true,
    [utils.asGridCoords(8,5)] : true,
    [utils.asGridCoords(8,4)] : true,
    [utils.asGridCoords(8,3)] : true,
    [utils.asGridCoords(8,2)] : true,
    [utils.asGridCoords(8,1)] : true,
    
    // house walls
    [utils.asGridCoords(7,11)] : true,
    [utils.asGridCoords(7,12)] : true,
    [utils.asGridCoords(6,12)] : true,
    [utils.asGridCoords(5,12)] : true,
    [utils.asGridCoords(4,12)] : true,
    [utils.asGridCoords(3,12)] : true,
    [utils.asGridCoords(2,12)] : true,
    [utils.asGridCoords(1,12)] : true,


    // lake walls
    [utils.asGridCoords(13,2)] : true,
    [utils.asGridCoords(13,3)] : true,
    [utils.asGridCoords(14,4)] : true,
    [utils.asGridCoords(14,5)] : true,
    [utils.asGridCoords(14,6)] : true,
    [utils.asGridCoords(15,7)] : true,
    [utils.asGridCoords(15,6)] : true,
    [utils.asGridCoords(16,6)] : true,
    [utils.asGridCoords(17,6)] : true,
    [utils.asGridCoords(18,6)] : true,
    [utils.asGridCoords(19,6)] : true,
    } 
  },
  MainRegion2: {
    id: "MainRegion2",
    lowerSrc: "/images/maps/MainRegion2Lower.png",
    upperSrc: "/images/maps/MainRegion1Upper.png",
    configObjects: {
        hero: {
          type: "Person",
          isPlayerControlled: true,
          x: utils.withGrid(7),
          y: utils.withGrid(6),
          src: "/images/characters/people/hero.png"
        },
    },
    cutsceneSpaces: {
      [utils.asGridCoords(0,16)]: [
        {
          events: [
            { 
              type: "changeMap", 
              map: "MainRegion1",
              x: utils.withGrid(18),
              y: utils.withGrid(15),
              direction: "left" 
            }
          ]
        }
      ],
      [utils.asGridCoords(3,0)]: [
        {
          events: [
            {
              type: "changeMap", 
              map: "MainRegion5",
              x: utils.withGrid(10),
              y: utils.withGrid(15),
              direction: "up"
            }
          ]
        }
      ],
      [utils.asGridCoords(19,16)]: [
        {
          events: [
            { 
              type: "changeMap", 
              map: "MainRegion3",
              x: utils.withGrid(0),
              y: utils.withGrid(14),
              direction: "right" 
            }
          ]
        }
      ]
    },
    
    walls: {
      // left walls
      [utils.asGridCoords(0,1)] : true,
      [utils.asGridCoords(0,2)] : true,
      [utils.asGridCoords(0,3)] : true,
      [utils.asGridCoords(0,4)] : true,
      [utils.asGridCoords(0,5)] : true,
      [utils.asGridCoords(0,6)] : true,
      [utils.asGridCoords(0,7)] : true,
      [utils.asGridCoords(0,8)] : true,
      [utils.asGridCoords(0,9)] : true,
      [utils.asGridCoords(0,10)] : true,
      [utils.asGridCoords(0,11)] : true,
      [utils.asGridCoords(0,12)] : true,
      [utils.asGridCoords(0,13)] : true,
      // [utils.asGridCoords(0,14)] : true,
      [utils.asGridCoords(0,15)] : true,
      //[utils.asGridCoords(0,16)] : true,
      [utils.asGridCoords(0,17)] : true,
      [utils.asGridCoords(0,18)] : true,

      // bottom walls
      //[utils.asGridCoords(1,16)] : true,
      [utils.asGridCoords(2,18)] : true,
      [utils.asGridCoords(3,18)] : true,
      [utils.asGridCoords(4,18)] : true,
      [utils.asGridCoords(5,18)] : true,
      [utils.asGridCoords(6,18)] : true,
      [utils.asGridCoords(7,18)] : true,
      [utils.asGridCoords(8,18)] : true,
      [utils.asGridCoords(9,18)] : true,
      [utils.asGridCoords(11,18)] : true,
      [utils.asGridCoords(12,18)] : true,
      [utils.asGridCoords(13,18)] : true,
      [utils.asGridCoords(14,18)] : true,
      [utils.asGridCoords(15,18)] : true,
      [utils.asGridCoords(16,18)] : true,
      [utils.asGridCoords(17,18)] : true,
      [utils.asGridCoords(18,18)] : true,
      [utils.asGridCoords(19,18)] : true,

      // top walls
      [utils.asGridCoords(1,0)] : true,
      [utils.asGridCoords(2,0)] : true,
      [utils.asGridCoords(3,0)] : true,
      [utils.asGridCoords(4,0)] : true,
      [utils.asGridCoords(5,0)] : true,
      [utils.asGridCoords(6,0)] : true,
      [utils.asGridCoords(7,0)] : true,
      [utils.asGridCoords(8,0)] : true,
      [utils.asGridCoords(9,0)] : true,
      [utils.asGridCoords(10,0)] : true,
      [utils.asGridCoords(11,0)] : true,
      [utils.asGridCoords(12,0)] : true,
      [utils.asGridCoords(13,0)] : true,
      [utils.asGridCoords(14,0)] : true,
      [utils.asGridCoords(15,0)] : true,
      [utils.asGridCoords(16,0)] : true,
      [utils.asGridCoords(17,0)] : true,
      [utils.asGridCoords(18,0)] : true,

      // crystal
      [utils.asGridCoords(17,5)] : true,
      [utils.asGridCoords(17,4)] : true,
      [utils.asGridCoords(18,5)] : true,
      [utils.asGridCoords(18,6)] : true,
      [utils.asGridCoords(14,10)] : true,
      [utils.asGridCoords(13,10)] : true,

      // right walls
      [utils.asGridCoords(19,0)] : true,
      [utils.asGridCoords(19,1)] : true,
      [utils.asGridCoords(19,2)] : true,
      [utils.asGridCoords(19,3)] : true,
      [utils.asGridCoords(19,4)] : true,
      [utils.asGridCoords(19,5)] : true,
      [utils.asGridCoords(19,6)] : true,
      [utils.asGridCoords(19,7)] : true,
      [utils.asGridCoords(19,8)] : true,
      [utils.asGridCoords(19,9)] : true,
      [utils.asGridCoords(19,10)] : true,
      [utils.asGridCoords(19,11)] : true,
      [utils.asGridCoords(19,12)] : true,
      [utils.asGridCoords(19,13)] : true,
      // [utils.asGridCoords(19,14)] : true,
      [utils.asGridCoords(19,15)] : true,
    }
  },

  MainRegion5: { //chapter 9 -- race 
    id: "MainRegion5",
    lowerSrc: "/images/maps/MainRegion5Lower.png",
    upperSrc: "/images/maps/Region3Upper.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(7),
        src: "/images/characters/people/hero.png",
      },
      trainer2 : {
        type: "Person",
        x: utils.withGrid(7),
        y: utils.withGrid(7),
        src: "/images/characters/people/trainer2.png",
        behaviorLoop: [
          { type: "walk", direction: "right", time: 2800 },
          { type: "walk", direction: "right", time: 2800 },
          { type: "walk", direction: "right", time: 2800 },
          { type: "walk", direction: "right", time: 2800 },
          { type: "walk", direction: "right", time: 2800 },
          { type: "walk", direction: "right", time: 2800 },
          { type: "stand", direction: "right", time: 3000 },
          { type: "walk", direction: "left", time: 2800 },
          { type: "walk", direction: "left", time: 2800 },
          { type: "walk", direction: "left", time: 2800 },
          { type: "walk", direction: "left", time: 2800 },
          { type: "walk", direction: "left", time: 2800 },
          { type: "walk", direction: "left", time: 2800 },
          { type: "stand", direction: "left", time: 3000 },
        ],
        talking: [
          {
            required: ["TALKED_FARMER1"],
            events: [
              { type: "textMessage", text: "Keep an eye out for more apples! They come in handy during races.", faceHero: "trainer2" }
            ]
          },
          {
            events: [
              { type: "textMessage", text: "Howdy, traveler. Did you find any apples and carrots in these parts? The horse will love them they will recover faster during the race.", faceHero: "trainer2" },
              { type: "textMessage", text: "Ladies and gentlemen, it's time for the race of a lifetime! Hold onto your hats!", faceHero: "trainer2"},
              { type: "textMessage", text: "Here's an apple for the road.", faceHero: "trainer2"},
              { type: "addItemToInventory", item: { actionId: "item_recoverHp", instanceId: "appleItem" } },
              { type: "addStoryFlag", flag: "TALKED_FARMER1" },
/// ADD RACE LIKE BATTLE HERE
            ]
          }
        ]
      },
      trainer3: {
        type: "Person",
        x: utils.withGrid(4),
        y: utils.withGrid(9),
        src: "/images/characters/people/brannpc.png",
        behaviorLoop: [
          { type: "walk", direction: "down", time: 2800 },
          { type: "walk", direction: "down", time: 2800 },
          { type: "stand", direction: "down", time: 2800 },
          { type: "walk", direction: "up" , time: 2800},
          { type: "walk", direction: "up" , time: 2800},
          { type: "stand", direction: "up", time: 2800 },
        ],
        talking: [
          {
            required: ["BATTLED_SELENE"],
            events: [
              { type: "textMessage", text: "We see you have some strong horses. See you around sometime, maybe for a rematch!", faceHero: "trainer3" }
            ]
          },
          {
            events: [
              { type: "textMessage", text: "I've been waiting for someone to race! Lets see if you can keep up with me!", faceHero: "trainer3"},
              { type: "textMessage", text: "I have a magnificent horse radiating an otherworldly aura, with unparalleled speed and grace.", faceHero: "trainer3"},
              { type: "battle", enemyId: "selene" },
              { type: "addStoryFlag", flag: "BATTLED_SELENE" },
            ]
          }
        ]
      },
      apple: {
        type: "Apple",
        id: "apple1",
        x: utils.withGrid(4),
        y: utils.withGrid(7),
        storyFlag: "COLLECTED_APPLE1"
      },
      apple2: {
        type: "Apple",
        id: "apple2",
        x: utils.withGrid(14),
        y: utils.withGrid(6),
        storyFlag: "COLLECTED_APPLE2"
      },
      apple3: {
        type: "Apple",
        id: "apple3",
        x: utils.withGrid(12),
        y: utils.withGrid(6),
        storyFlag: "COLLECTED_APPLE2"
      },
    },
    cutsceneSpaces: {
      [utils.asGridCoords(10,19)]: [
        {
          events: [
            { 
              type: "changeMap", 
              map: "MainRegion2",
              x: utils.withGrid(4),
              y: utils.withGrid(0),
              direction: "down" 
            }
          ]
        }
      ],
      [utils.asGridCoords(19,9)]: [
        {
          events: [
            { 
              type: "changeMap", 
              map: "RegionFour",
              x: utils.withGrid(0),
              y: utils.withGrid(9),
              direction: "right" 
            }
          ]
        }
      ]
    },
    walls: {
      [utils.asGridCoords(0,5)] : true,
      [utils.asGridCoords(0,6)] : true,
      [utils.asGridCoords(0,7)] : true,
      [utils.asGridCoords(0,8)] : true,
      [utils.asGridCoords(0,9)] : true,
      [utils.asGridCoords(0,10)] : true,
      [utils.asGridCoords(0,11)] : true,
      [utils.asGridCoords(0,12)] : true,
      [utils.asGridCoords(0,13)] : true,
      [utils.asGridCoords(0,14)] : true,
      [utils.asGridCoords(0,15)] : true,
      [utils.asGridCoords(1,4)] : true,
      [utils.asGridCoords(2,5)] : true,
      [utils.asGridCoords(3,5)] : true,
      [utils.asGridCoords(4,4)] : true,
      [utils.asGridCoords(5,4)] : true,
      [utils.asGridCoords(5,3)] : true,
      [utils.asGridCoords(5,2)] : true,
      [utils.asGridCoords(5,1)] : true,
      [utils.asGridCoords(6,0)] : true,
      [utils.asGridCoords(7,0)] : true,
      [utils.asGridCoords(8,0)] : true,
      [utils.asGridCoords(9,0)] : true,
      [utils.asGridCoords(10,0)] : true,
      [utils.asGridCoords(11,0)] : true,
      [utils.asGridCoords(12,0)] : true,
      [utils.asGridCoords(13,0)] : true,
      [utils.asGridCoords(14,0)] : true,
      [utils.asGridCoords(15,1)] : true,
      [utils.asGridCoords(15,2)] : true,
      [utils.asGridCoords(15,3)] : true,
      [utils.asGridCoords(16,4)] : true,
      [utils.asGridCoords(17,4)] : true,
      [utils.asGridCoords(18,4)] : true,
      [utils.asGridCoords(19,5)] : true,
      [utils.asGridCoords(19,6)] : true,
      [utils.asGridCoords(19,7)] : true,
      [utils.asGridCoords(19,8)] : true,
      [utils.asGridCoords(19,10)] : true,
      [utils.asGridCoords(19,11)] : true,
      [utils.asGridCoords(19,12)] : true,
      [utils.asGridCoords(19,13)] : true,
      [utils.asGridCoords(19,14)] : true,
      [utils.asGridCoords(19,15)] : true,
      [utils.asGridCoords(20,9)] : true,
      [utils.asGridCoords(1,16)] : true,
      [utils.asGridCoords(2,16)] : true,
      [utils.asGridCoords(3,16)] : true,
      [utils.asGridCoords(4,16)] : true,
      [utils.asGridCoords(4,17)] : true,
      [utils.asGridCoords(4,18)] : true,
      [utils.asGridCoords(5,19)] : true,
      [utils.asGridCoords(6,19)] : true,
      [utils.asGridCoords(7,19)] : true,
      [utils.asGridCoords(8,19)] : true,
      [utils.asGridCoords(9,19)] : true,
      [utils.asGridCoords(11,19)] : true,
      [utils.asGridCoords(12,19)] : true,
      [utils.asGridCoords(13,19)] : true,
      [utils.asGridCoords(14,19)] : true,
      [utils.asGridCoords(15,19)] : true,
      [utils.asGridCoords(16,19)] : true,
      [utils.asGridCoords(10,20)] : true,
    }
  },

  MainRegion3: {
    id: "MainRegion3",
    lowerSrc: "/images/maps/MainRegion3Lower.png",
    upperSrc: "/images/maps/MainRegion1Upper.png",
    configObjects: {
        hero: {
          type: "Person",
          isPlayerControlled: true,
          x: utils.withGrid(7),
          y: utils.withGrid(6),
          src: "/images/characters/people/hero.png"
        },
        npcA: {
          type: "Person",
          x: utils.withGrid(15),
          y: utils.withGrid(8),
          src: "/images/characters/people/girl2.png",
          behaviorLoop: [
            { type: "stand", direction: "left", time: 1100},
            { type: "stand", direction: "down", time: 1100 },
            { type: "stand", direction: "right", time: 1000 },
            { type: "stand", direction: "down", time: 1100 },
          ],
          talking: [
            {
              events: [
                { type: "textMessage", text: "I read that crystals can attract a unicorn!", faceHero:"npcA" },
                { type: "textMessage", text: "So this is a pretty good place to tame one!", faceHero:"npcA" }
              ]
            }
          ]
        },
        npcB: {
          type: "Person",
          x: utils.withGrid(5),
          y: utils.withGrid(10),
          src: "/images/characters/people/girl4.png",
          talking: [
            {
              events: [
                { type: "textMessage", text: "This forest has been known to possess magical creatures!", faceHero:"npcB" },
                { type: "textMessage", text: "Maybe you have a chance of finding one.", faceHero:"npcB" }
              ]
            }
          ]
        },
        horseA: {
          type: "Person",
          x: utils.withGrid(14),
          y: utils.withGrid(4),
          src: "/images/characters/horses/uni1.png",
          talking: [
            {
              events: [
                { type: "textMessage", text: "Nraaah!", faceHero:"horseA" }
                //add horse sound
              ]
            }
          ]
        },
        horseSpawner: {
          type: "HorseSpawner",
          x: utils.withGrid(16),
          y: utils.withGrid(2),
          storyFlag: "USED_HORSE_SPAWNER_U1",
          horses: ["u001"]
      },
    },
    cutsceneSpaces: {
      [utils.asGridCoords(0,14)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "MainRegion2",
              x: utils.withGrid(19),
              y: utils.withGrid(16),
              direction: "left" 
            }
          ]
        }
      ],
      [utils.asGridCoords(19,14)]: [
        {
          events: [
            { 
              type: "changeMap", 
              map: "MainRegion4",
              x: utils.withGrid(1),
              y: utils.withGrid(14),
              direction: "right" 
            }
          ]
        }
      ]
    },
    
    walls: {
      // left walls
      [utils.asGridCoords(0,1)] : true,
      [utils.asGridCoords(0,2)] : true,
      [utils.asGridCoords(0,3)] : true,
      [utils.asGridCoords(0,4)] : true,
      [utils.asGridCoords(0,5)] : true,
      [utils.asGridCoords(0,6)] : true,
      [utils.asGridCoords(0,7)] : true,
      [utils.asGridCoords(0,8)] : true,
      [utils.asGridCoords(0,9)] : true,
      [utils.asGridCoords(0,10)] : true,
      [utils.asGridCoords(0,11)] : true,
      [utils.asGridCoords(0,12)] : true,
      [utils.asGridCoords(0,13)] : true,
      // [utils.asGridCoords(0,14)] : true,
      [utils.asGridCoords(0,15)] : true,
      [utils.asGridCoords(0,16)] : true,
      [utils.asGridCoords(0,17)] : true,
      [utils.asGridCoords(0,18)] : true,

      // bottom walls
      [utils.asGridCoords(1,16)] : true,
      [utils.asGridCoords(2,16)] : true,
      [utils.asGridCoords(3,16)] : true,
      [utils.asGridCoords(4,16)] : true,
      [utils.asGridCoords(5,16)] : true,
      [utils.asGridCoords(6,16)] : true,
      [utils.asGridCoords(7,16)] : true,
      [utils.asGridCoords(8,16)] : true,
      [utils.asGridCoords(9,16)] : true,
      [utils.asGridCoords(10,16)] : true,
      [utils.asGridCoords(11,16)] : true,
      [utils.asGridCoords(12,16)] : true,
      [utils.asGridCoords(13,16)] : true,
      [utils.asGridCoords(14,16)] : true,
      [utils.asGridCoords(15,16)] : true,
      [utils.asGridCoords(16,16)] : true,
      [utils.asGridCoords(17,16)] : true,
      [utils.asGridCoords(18,16)] : true,
      [utils.asGridCoords(19,16)] : true,

      // top walls
      [utils.asGridCoords(1,0)] : true,
      [utils.asGridCoords(2,0)] : true,
      [utils.asGridCoords(3,0)] : true,
      [utils.asGridCoords(4,0)] : true,
      [utils.asGridCoords(5,0)] : true,
      [utils.asGridCoords(6,0)] : true,
      [utils.asGridCoords(7,0)] : true,
      [utils.asGridCoords(8,0)] : true,
      [utils.asGridCoords(9,0)] : true,
      [utils.asGridCoords(10,0)] : true,
      [utils.asGridCoords(11,0)] : true,
      [utils.asGridCoords(12,0)] : true,
      [utils.asGridCoords(13,0)] : true,
      [utils.asGridCoords(14,0)] : true,
      [utils.asGridCoords(15,0)] : true,
      [utils.asGridCoords(16,0)] : true,
      [utils.asGridCoords(17,0)] : true,
      [utils.asGridCoords(18,0)] : true,

      // crystal
      [utils.asGridCoords(17,5)] : true,
      [utils.asGridCoords(17,4)] : true,
      [utils.asGridCoords(18,5)] : true,
      [utils.asGridCoords(18,6)] : true,
      [utils.asGridCoords(14,10)] : true,
      [utils.asGridCoords(13,10)] : true,

      // right walls
      [utils.asGridCoords(19,0)] : true,
      [utils.asGridCoords(19,1)] : true,
      [utils.asGridCoords(19,2)] : true,
      [utils.asGridCoords(19,3)] : true,
      [utils.asGridCoords(19,4)] : true,
      [utils.asGridCoords(19,5)] : true,
      [utils.asGridCoords(19,6)] : true,
      [utils.asGridCoords(19,7)] : true,
      [utils.asGridCoords(19,8)] : true,
      [utils.asGridCoords(19,9)] : true,
      [utils.asGridCoords(19,10)] : true,
      [utils.asGridCoords(19,11)] : true,
      [utils.asGridCoords(19,12)] : true,
      [utils.asGridCoords(19,13)] : true,
      // [utils.asGridCoords(19,14)] : true,
      [utils.asGridCoords(19,15)] : true,

      // rock walls
      [utils.asGridCoords(10,1)] : true,
      [utils.asGridCoords(10,2)] : true,
      [utils.asGridCoords(10,3)] : true,
      [utils.asGridCoords(10,4)] : true,
      [utils.asGridCoords(10,5)] : true,
      [utils.asGridCoords(10,6)] : true,
      [utils.asGridCoords(10,7)] : true,
      [utils.asGridCoords(10,8)] : true,
      [utils.asGridCoords(10,9)] : true,
      [utils.asGridCoords(10,10)] : true,
      [utils.asGridCoords(10,11)] : true,
      [utils.asGridCoords(10,12)] : true,
      [utils.asGridCoords(10,13)] : true,
      // [utils.asGridCoords(10,14)] : true,
      [utils.asGridCoords(10,15)] : true,
      [utils.asGridCoords(10,16)] : true,
      [utils.asGridCoords(10,17)] : true,
      [utils.asGridCoords(12,1)] : true,
      [utils.asGridCoords(12,2)] : true,
      [utils.asGridCoords(12,3)] : true,
      [utils.asGridCoords(12,4)] : true,
      [utils.asGridCoords(12,5)] : true,
      [utils.asGridCoords(12,6)] : true,
      [utils.asGridCoords(12,7)] : true,
      [utils.asGridCoords(12,8)] : true,
      [utils.asGridCoords(11,9)] : true,
      [utils.asGridCoords(11,10)] : true,
      [utils.asGridCoords(11,11)] : true,
      [utils.asGridCoords(11,12)] : true,
      [utils.asGridCoords(11,13)] : true,
      [utils.asGridCoords(11,15)] : true,
      [utils.asGridCoords(11,16)] : true,
    },
  },
  MainRegion4: {
    id: "MainRegion4",
    lowerSrc: "/images/maps/MainRegion4Lower.png",
    upperSrc: "/images/maps/MainRegion1Upper.png",
    configObjects: {
        hero: {
          type: "Person",
          isPlayerControlled: true,
          x: utils.withGrid(7),
          y: utils.withGrid(6),
          src: "/images/characters/people/hero.png"
        },
        npcA: {
          type: "Person",
          x: utils.withGrid(5),
          y: utils.withGrid(8),
          src: "/images/characters/people/guy6.png",
          behaviorLoop: [
            { type: "walk", direction: "down", time: 1800 },
            { type: "walk", direction: "down", time: 1800 },
            { type: "walk", direction: "down", time: 1800 },
            { type: "stand", direction: "down", time: 1400 },
            { type: "walk", direction: "right", time: 1800 },
            { type: "walk", direction: "right", time: 1800 },
            { type: "walk", direction: "right", time: 1800 },
            { type: "stand", direction: "right", time: 1400 },
            { type: "walk", direction: "up", time: 1300 },
            { type: "walk", direction: "up", time: 1300 },
            { type: "walk", direction: "up", time: 1300 },
            { type: "stand", direction: "up", time: 1300 },
            { type: "walk", direction: "left", time: 1300 },
            { type: "walk", direction: "left", time: 1300 },
            { type: "walk", direction: "left", time: 1300 },
            { type: "stand", direction: "left", time: 1300 },
        ],
          talking: [
            {
              events: [
                { type: "textMessage", text: "Man, I saw a pegasus across the river!", faceHero:"npcA" },
                { type: "textMessage", text: "I need a boat to get across!", faceHero:"npcA" }
              ]
            }
          ]
        }
    },
    
    walls: {
      // well & bucket
      [utils.asGridCoords(11,12)] : true,
      [utils.asGridCoords(10,12)] : true,
      [utils.asGridCoords(10,11)] : true,
      [utils.asGridCoords(11,11)] : true,

      // left walls
      [utils.asGridCoords(0,1)] : true,
      [utils.asGridCoords(0,2)] : true,
      [utils.asGridCoords(0,3)] : true,
      [utils.asGridCoords(0,4)] : true,
      [utils.asGridCoords(0,5)] : true,
      [utils.asGridCoords(0,6)] : true,
      [utils.asGridCoords(0,7)] : true,
      [utils.asGridCoords(0,8)] : true,
      [utils.asGridCoords(0,9)] : true,
      [utils.asGridCoords(0,10)] : true,
      [utils.asGridCoords(0,11)] : true,
      [utils.asGridCoords(0,12)] : true,
      [utils.asGridCoords(0,13)] : true,
      // [utils.asGridCoords(0,14)] : true,
      [utils.asGridCoords(0,15)] : true,
      [utils.asGridCoords(0,16)] : true,
      [utils.asGridCoords(0,17)] : true,
      [utils.asGridCoords(0,18)] : true,

      // bottom walls
      [utils.asGridCoords(1,16)] : true,
      [utils.asGridCoords(2,16)] : true,
      [utils.asGridCoords(3,16)] : true,
      [utils.asGridCoords(4,16)] : true,
      [utils.asGridCoords(5,16)] : true,
      [utils.asGridCoords(6,16)] : true,
      [utils.asGridCoords(7,16)] : true,
      [utils.asGridCoords(8,16)] : true,
      [utils.asGridCoords(9,16)] : true,
      [utils.asGridCoords(10,16)] : true,
      [utils.asGridCoords(11,16)] : true,
      [utils.asGridCoords(12,16)] : true,
      [utils.asGridCoords(13,16)] : true,
      [utils.asGridCoords(14,16)] : true,
      [utils.asGridCoords(15,16)] : true,
      [utils.asGridCoords(16,16)] : true,
      [utils.asGridCoords(17,16)] : true,
      [utils.asGridCoords(18,16)] : true,
      [utils.asGridCoords(19,16)] : true,

      // top walls
      [utils.asGridCoords(1,1)] : true,
      [utils.asGridCoords(2,1)] : true,
      [utils.asGridCoords(3,1)] : true,
      [utils.asGridCoords(4,1)] : true,
      [utils.asGridCoords(5,1)] : true,
      [utils.asGridCoords(6,1)] : true,

      // right walls
      [utils.asGridCoords(6,0)] : true,
      [utils.asGridCoords(6,1)] : true,
      [utils.asGridCoords(6,2)] : true,
      [utils.asGridCoords(7,2)] : true,
      [utils.asGridCoords(8,2)] : true,
      [utils.asGridCoords(9,3)] : true,
      [utils.asGridCoords(10,4)] : true,
      [utils.asGridCoords(11,5)] : true,
      [utils.asGridCoords(11,6)] : true,
      [utils.asGridCoords(12,7)] : true,
      [utils.asGridCoords(13,8)] : true,
      [utils.asGridCoords(13,9)] : true,
      [utils.asGridCoords(13,10)] : true,
      [utils.asGridCoords(13,11)] : true,
      [utils.asGridCoords(13,12)] : true,
      [utils.asGridCoords(13,13)] : true,
      [utils.asGridCoords(13,14)] : true,
      [utils.asGridCoords(13,15)] : true,
      [utils.asGridCoords(13,16)] : true,
      [utils.asGridCoords(13,17)] : true,

    },
    cutsceneSpaces: {
      [utils.asGridCoords(0,14)]: [
        {
          events: [
            {
              type: "changeMap", 
              map: "MainRegion3",
              x: utils.withGrid(18),
              y: utils.withGrid(14),
              direction: "left"
            }
          ]
        }
      ],
    }
  },
}
