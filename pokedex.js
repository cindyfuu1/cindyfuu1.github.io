/*
 * Cindy Fu
 * August 7th
 * Section AC
 * This is a pokedex.js page that request info of pokemons from Pokedex API and let
 * users to play battles with other pokemons. If the pokemon user chose won a game,
 * user can win the opponent's pokemon in the game. User can also click the flee
 * button to flee the game they do not want to play.
 */
'use strict';

(function() {
  const URL = 'https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/';
  window.addEventListener('load', init);
  let currentName;
  let gameGuid;
  let gamePid;

  /**
   * Initialize the page by requesting all pokemon's info to load the pokedex
   */
  async function init() {
    try {
      let findAll = URL + 'pokedex.php?pokedex=all';
      let response = await fetch(findAll);
      response = await statusCheck(response);
      response = await response.text();
      loadPage(response);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * load all pokemon's images in the pokedex view, intialize three pokemons
   * for user to play with
   * @param {Object} response - all pokemons' name and shortname
   */
  function loadPage(response) {
    let paths = response.split('\n');
    let container = id('pokedex-view');
    for (let i = 0; i < paths.length; i++) {
      let position = paths[i].indexOf(':');
      let shortName = paths[i].substring(position + 1);
      let picP = URL + 'sprites/' + shortName + '.png';
      let newImg = gen('img');
      newImg.src = picP;
      newImg.alt = shortName;
      container.appendChild(newImg);
      newImg.classList.add('sprite');
      if (shortName === 'bulbasaur' || shortName === 'charmander' || shortName === 'squirtle') {
        newImg.classList.add('found');
      }
    }
    let foundImg = qsa('.found');
    for (let i = 0; i < foundImg.length; i++) {
      foundImg[i].addEventListener('click', async function() {
        currentName = foundImg[i].alt;
        await updateCurrentPokemon();
        id('start-btn').addEventListener('click', game);
      });
    }
  }

  /**
   * request info from API and display user the selected pokemon's data in the card
   */
  async function updateCurrentPokemon() {
    try {
      let dataP = URL + 'pokedex.php?pokemon=' + currentName;
      let data = await fetch(dataP);
      data = await statusCheck(data);
      data = await data.json();
      displayData('#p1', data);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * display selected pokemon's name, move, health point, description in the card
   * @param {String} num - represents card for the first pokemon or the second pokemon
   * @param {Object} data - data of the selected pokemon from pokedex API
   */
  function displayData(num, data) {
    let startB = id('start-btn');
    startB.classList.remove('hidden');
    basicCardInfo(num, data);
    restoreButton(num);
    hideButton(num, data.moves.length);

    let moveButtons = qsa(num + ' .move');
    let moveButtonsDP = qsa(num + ' .dp');
    let moveImage = qsa(num + ' .moves img');
    for (let i = 0; i < data.moves.length; i++) {
      moveButtons[i].textContent = data.moves[i].name;
      if (data.moves[i].dp !== undefined) {
        moveButtonsDP[i].textContent = data.moves[i].dp + " DP";
      } else {
        moveButtonsDP[i].textContent = '';
      }
      moveImage[i].src = URL + 'icons/' + data.moves[i].type + '.jpg';
      moveButtons[i].alt = data.info.type;
    }
  }

  /**
   * initialize the actual battle between two pokemons; Hide and display elements
   * to display data in the game
   */
  async function game() {
    let baseURL = URL + 'game.php';
    id('pokedex-view').classList.add('hidden');
    id('p2').classList.remove('hidden');
    let hpBar = qsa('.hp-info');
    hpBar[0].classList.remove('hidden');
    hpBar[1].classList.remove('hidden');
    id('results-container').classList.remove('hidden');
    id('flee-btn').classList.remove('hidden');
    let button = qsa('#p1 button');
    for (let i = 0; i < button.length; i++) {
      button[i].disabled = false;
    }
    qs('h1').textContent = 'Pokemon Battle!';
    await retrieveData(baseURL);
    id('flee-btn').addEventListener('click', function() {
      makeAMove(baseURL, 'flee');
    });
    for (let i = 0; i < qsa('.moves button').length; i++) {
      qsa('.moves button')[i].addEventListener('click', async function() {
        await makeAMove(baseURL, qsa('.moves button .move')[i].textContent);
      });
    }
    id('start-btn').classList.add('hidden');
  }

  /**
   * request data about two pokemons from pokedex API to initialize the actual battle
   * @param {String} baseURL - url to request information from API
   */
  async function retrieveData(baseURL) {
    try {
      let value = new FormData();
      value.append('startgame', 'true');
      value.append('mypokemon', currentName);
      let response = await fetch(baseURL, {method: "POST", body: value});
      response = await statusCheck(response);
      response = await response.json();
      gamePid = response.pid;
      gameGuid = response.guid;
      displayData('#p2', response.p2);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * request data about information for a move made by user form pokedex API and
   * display information back to user after that move
   * @param {String} baseURL - url to request information from API
   * @param {String} move - move selected by user
   */
  async function makeAMove(baseURL, move) {
    // retrieve move data
    try {
      id('loading').classList.remove('hidden');
      let value = new FormData();
      value.append('guid', gameGuid);
      value.append('pid', gamePid);
      value.append('movename', move);
      value = await fetch(baseURL, {method: "POST", body: value});
      value = await statusCheck(value);
      value = await value.json();
      await gameResult(value);
      id('loading').classList.add('hidden');
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * display the game result after that move, which includes the move made by two
   * pokemons and if they are hit or missed. Update the health point of two pokemons;
   * change the health bar color if their health point is lower than 20
   * @param {Object} value - data request from pokedex API that includes information
   * about two pokemons after their moves.
   */
  async function gameResult(value) {
    let move = value.results['p1-move'];
    let resultOne = id('p1-turn-results');
    resultOne.classList.remove('hidden');
    resultOne.textContent = 'Player 1 played ' + value.results['p1-move'] + ' and ' +
    value.results['p1-result'] + '!';
    let resultTwo = id('p2-turn-results');
    resultTwo.classList.remove('hidden');
    resultTwo.textContent = 'Player 2 played ' + value.results['p2-move'] + ' and ' +
    value.results['p2-result'] + '!';

    let hpPercentOne = Math.floor(value.p1['current-hp'] / value.p1.hp * 100);
    let hpPercentTwo = Math.floor(value.p2['current-hp'] / value.p2.hp * 100);
    qs('#p1 .hp').textContent = value.p1['current-hp'] + 'HP';
    qs('#p2 .hp').textContent = value.p2['current-hp'] + 'HP';

    qs('#p1 .health-bar').style.width = hpPercentOne + '%';
    qs('#p2 .health-bar').style.width = hpPercentTwo + '%';
    ifChangeRed(hpPercentOne, '#p1');
    ifChangeRed(hpPercentTwo, '#p2');
    let p2Short = value.p2.shortname;
    if (hpPercentOne === 0) {
      await gameEnd('You lost!', p2Short, move);
    }
    if (hpPercentTwo === 0) {
      await gameEnd('You won!', p2Short, move);
    }
  }

  /**
   * Change the health bar to red if the pokemon's health point is lower than 20
   * @param {Integer} percent - pokemon's health point
   * @param {String} pNum - specify if it is the user's pokemon or the opponent's pokemon
   */
  function ifChangeRed(percent, pNum) {
    if (percent < 20 && qs(pNum + ' .low-health') === null) {
      qs(pNum + ' .health-bar').classList.add('low-health');
    }
  }

  /**
   * Notify user the state of game when finished; Disable all move buttons;
   * @param {String} message - message of the state of game, winning or losing
   * @param {String} p2Short - opponent pokemon's shortname
   * @param {String} move - move made by user
   */
  function gameEnd(message, p2Short, move) {
    qs('h1').textContent = message;
    id('flee-btn').classList.add('hidden');
    let allButton = qsa('#p1 .moves button');
    for (let i = 0; i < allButton.length; i++) {
      allButton[i].disabled = true;
    }
    id('endgame').classList.remove('hidden');
    if (message === 'You won!' || move === 'flee') {
      id('p2-turn-results').classList.add('hidden');
    }
    id('endgame').addEventListener('click', async function() {
      await pokedexView(message, p2Short);
    });
  }

  /**
   * change the game view before the battle, which include pokedex for user to select
   * the next pokemon to play with
   * @param {String} message - message of the state of game, winning or losing
   * @param {String} p2Short - opponent pokemon's shortname
   */
  function pokedexView(message, p2Short) {
    id('endgame').classList.add('hidden');
    id('results-container').classList.add('hidden');
    id('p1-turn-results').textContent = '';
    id('p2-turn-results').textContent = '';
    id('p2').classList.add('hidden');
    qs('#p1 .hp-info').classList.add('hidden');
    id('start-btn').classList.remove('hidden');
    id('pokedex-view').classList.remove('hidden');
    qs('h1').textContent = 'Your Pokedex';

    let originalHPOne = qs('#p1 .health-bar').style.width;
    resetHealth('#p1', originalHPOne);
    let originalHPTwo = qs('#p2 .health-bar').style.width;
    resetHealth('#p2', originalHPTwo);
    if (message === 'You won!') {
      let allImg = qsa('#pokedex-view img');
      for (let i = 0; i < allImg.length; i++) {
        if (allImg[i].alt === p2Short) {
          allImg[i].classList.add('found');
        }
      }
    }
  }

  /**
   * reseat the health bar and its length when a game is finished for the next game to play
   * @param {String} num - specify which pokemon's information we are adjusting
   * @param {Integer} originalHP - the health point of pokemon in the last round
   */
  function resetHealth(num, originalHP) {
    let lastP = originalHP.length - 1;
    let widthStr = originalHP.substring(0, lastP);
    let health = parseInt(widthStr);
    if (health < 20) {
      qs(num + ' .health-bar').classList.remove('low-health');
    }
    qs(num + ' .health-bar').style.width = '100%';
  }

  /**
   * display the basic information of the selected pokemon in a card, including the name,
   * picture, weakness, description, type.
   * @param {String} num - specify which pokemon's information we are adjusting
   * @param {Object} data - information request from the pokedex API about the pokemon's info
   */
  function basicCardInfo(num, data) {
    let cardName = qs(num + ' .name');
    cardName.textContent = data.name;
    let pokepic = qs(num + ' .pokepic');
    pokepic.src = URL + data.images.photo;
    pokepic.alt = data.name;
    let icon = qs(num + ' .type');
    icon.src = URL + data.images.typeIcon;
    icon.alt = data.info.type;
    let weakIcon = qs(num + ' .weakness');
    weakIcon.src = URL + data.images.weaknessIcon;
    weakIcon.alt = data.info.weakness;
    qs(num + ' .hp').textContent = data.hp + 'HP';
    qs(num + ' .info').textContent = data.info.description;
  }

  /**
   * restore the button that has been hide
   * @param {String} num - specify which pokemon's information we are adjusting
   */
  function restoreButton(num) {
    let disable = qsa(num + ' .moves .hidden');
    if (disable.length !== 0) {
      for (let i = 0; i < disable.length; i++) {
        disable[i].classList.remove('hidden');
      }
    }
  }

  /**
   * hide the button based on the number of pokemon's move
   * @param {String} num - specify which pokemon's information we are adjusting
   * @param {Integer} length - the length of moves/ the number of moves of the pokemon
   */
  function hideButton(num, length) {
    if (length < 4) {
      for (let i = 3; i > length - 1; i--) {
        qsa(num + ' .moves button')[i].classList.add('hidden');
      }
    }
  }

  /**
   * Check the status when retrieving information form API. Throw error if web
   * status is not okay
   * @param {Object} response - a random user's information
   * @returns {Object} response - a random user's information
   */
  async function statusCheck(response) {
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response;
  }

  /**
   * find the element whose id property matches the specified string
   * @param {String} id - the ID of the element to find
   * @returns {HTMLElement} an element object that has the id
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * find the first element that has the selector
   * @param {String} selector - a string that represent the element that has the selector
   * @returns {NodeList} the first element in the DOM that has the selector
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * find a list of elements that has specific selector
   * @param {String} selector - a string that represento ne or more element
   * that has the selector
   * @returns {NodeList} a list of elements with the specific selectors
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * generate a new element that is specific type
   * @param {String} tagName - a string that represent the type of element to be created
   * @returns {HTMLElement} an HTML elemnt that is the type of tagName
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }
})();