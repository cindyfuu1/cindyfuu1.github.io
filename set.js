/*
 * Cindy Fu
 * July 22th
 * Section AC
 * This is a index.js page to add behavior to Set! game. This file
 * gives many actions that allow users to play this game. Users can
 * choose the difficulty level and the time they want to play this
 * game on the first page. On the game page, user can select cards
 * to kow if they belong to a set. User can also refresh the page
 * to get new cards and go back to the main page.
 */
'use strict';

(function() {
  const STYLE = ['solid', 'outline', 'striped'];
  const COLOR = ['green', 'purple', 'red'];
  const SHAPE = ['diamond', 'oval', 'squiggle'];
  const COUNT = [1, 2, 3];
  let timerID;
  let remainingSeconds;
  window.addEventListener('load', init);

  /**
   * gives intial behavior to Start, Back to Main, and Refresh Board
   * button.
   */
  function init() {
    let startB = id('start-btn');
    let backB = id('back-btn');
    let refB = id('refresh-btn');

    startB.addEventListener('click', toggleViews);
    startB.addEventListener('click', startTimer);
    startB.addEventListener('click', appendCard);
    backB.addEventListener('click', toggleViews);
    backB.addEventListener('click', reset);
    refB.addEventListener('click', refresh);
  }

  /**
   * refresh the game board to generate new cards.
   */
  function refresh() {
    let cards = qsa('.card');
    for (let i = 0; i < cards.length; i++) {
      let newDiv = generateUniqueCard(ifIsEasy());
      id('board').replaceChild(newDiv, cards[i]);
    }
  }

  /**
   * reset the board to prepare for the next game when user click "Back to Main"
   * button
   */
  function reset() {
    id('refresh-btn').disabled = false;
    id('set-count').textContent = 0;
    clearInterval(timerID);
    id('board').innerHTML = '';
  }

  /**
   * check what type of game, standard or easy, the user select to play
   * @returns {boolean} represents if the game mode is easy or standard
   */
  function ifIsEasy() {
    let diffLevel;
    let options = document.getElementsByName('diff');
    for (let i = 0; i < options.length; i++) {
      if (options[i].checked) {
        diffLevel = options[i].value;
      }
    }
    return diffLevel === 'easy';
  }

  /**
   * append the 9 cards to the game board if users select easy mode;
   * append the 12 cards if the users select standard mode;
   */
  function appendCard() {
    let num;
    if (ifIsEasy()) {
      num = 9;
    } else {
      num = 12;
    }
    for (let i = 0; i < num; i++) {
      let newCard = generateUniqueCard(ifIsEasy());
      id('board').appendChild(newCard);
    }
  }

  /**
   * switch between the menu view and the game view
   */
  function toggleViews() {
    let menu = id('menu-view');
    let game = id('game-view');
    menu.classList.toggle('hidden');
    game.classList.toggle('hidden');
  }

  /**
   * generate random attributes for a card
   * @param {Boolean} isEasy - true if user select easy mode, otherwise false
   * @returns {Array} an list of random attributes
   */
  function generateRandomAttributes(isEasy) {
    let randNum = [];
    let rand;
    let fir;
    for (let i = 0; i < 4; i++) {
      rand = Math.floor(Math.random() * 3);
      randNum[i] = rand;
    }
    if (isEasy) {
      fir = 0;
    } else {
      fir = randNum[0];
    }
    let sec = randNum[1];
    let thr = randNum[2];
    let fou = randNum[3];
    return [STYLE[fir], SHAPE[sec], COLOR[thr], COUNT[fou]];
  }

  /**
   * generate unique cards in the board, with unique elements and number of elements
   * @param {Boolean} isEasy - true if user select easy mode, otherwise false
   * @returns {HTMLElement} a card that has random and unique attributes amond other cards
   */
  function generateUniqueCard(isEasy) {
    let atr = generateRandomAttributes(isEasy);
    let card = gen('div');
    card.id = atr[0] + '-' + atr[1] + '-' + atr[2] + '-' + atr[3];
    while (id(card.id) !== null) {
      atr = generateRandomAttributes(isEasy);
      card.id = atr[0] + '-' + atr[1] + '-' + atr[2] + '-' + atr[3];
    }
    for (let i = 0; i < atr[3]; i++) {
      let img = gen('img');
      img.src = 'img/' + atr[0] + '-' + atr[1] + '-' + atr[2] + '.png';
      img.alt = card.id;
      card.appendChild(img);
    }
    card.classList.add('card');
    card.addEventListener('click', cardSelected);
    return card;
  }

  /**
   * start a timer when a new game started
   */
  function startTimer() {
    let select = qs('select');
    let time = select.options[select.selectedIndex].value;
    let timer = id('time');
    timer.textContent = "0" + time / 60 + ":00";
    timerID = setInterval(advanceTimer, 1000);
  }

  /**
   * decrement the timer by 1 second
   */
  function advanceTimer() {
    let timer = id('time').textContent;
    let sec = timer.substring(3, 5);
    if (sec === '00') {
      remainingSeconds = 59;
      id('time').textContent = '0' + (timer[1] - 1) + ':' + remainingSeconds;
    } else {
      remainingSeconds -= 1;
      id('time').textContent = timer.substring(0, 2) + ':';
      if (remainingSeconds < 10) {
        id('time').textContent += '0' + remainingSeconds;
      } else {
        id('time').textContent += remainingSeconds;
      }
    }
    if (id('time').textContent === '00:00') {
      timeUp();
    }
  }

  /**
   * remove all selected call from card when time is up; disable refresh button
   * and stop decrementing time
   */
  function timeUp() {
    id('refresh-btn').disabled = true;
    clearInterval(timerID);
    timerID = null;
    let sCard = qsa('.selected');
    for (let i = 0; i < sCard.length; i++) {
      sCard[i].classList.remove('selected');
    }
    let allC = qsa('.card');
    for (let i = 0; i < allC.length; i++) {
      allC[i].removeEventListener('click', cardSelected);
    }
  }

  /**
   * select the card and check if three cards are selected and if these three
   * cards are a set; notify the user with a string of 'SET!' and increment
   * the count of set by 1 if they are a set, otherwise show 'Not a Set';
   */
  function cardSelected() {
    let newCard;
    this.classList.toggle('selected');
    let select = qsa('.selected');
    if (select.length === 3) {
      let isSet = isASet(select);
      if (isSet) {
        let num = id('set-count');
        num.textContent = parseInt(num.textContent) + 1;
      }
      for (let i = 0; i < select.length; i++) {
        select[i].classList.toggle('selected');
        if (isSet) {
          newCard = generateUniqueCard(ifIsEasy());
          id('board').replaceChild(newCard, select[i]);
          changeCard(newCard, 'SET!');
        } else {
          changeCard(select[i], 'Not a Set');
        }
      }
    }
  }

  /**
   * append and show a new paragraph on the cards, which notify the user if cards
   * selected are a set or not; remove the paragraph and show picture on the card
   * after one second
   * @param {HTMLElement} card - an element that holds the card
   * @param {String} text - stirng that notify the user if cards are a set or not
   */
  function changeCard(card, text) {
    let newP = gen('p');
    newP.textContent = text;
    card.appendChild(newP);
    card.classList.add('hide-imgs');
    setTimeout(function() {
      let p = qs('.hide-imgs p');
      card.removeChild(p);
      card.classList.remove('hide-imgs');
    }, 1000);
  }

  /**
   * Checks to see if the three selected cards make up a valid set. This is done by comparing each
   * of the type of attribute against the other two cards. If each four attributes for each card are
   * either all the same or all different, then the cards make a set. If not, they do not make a set
   * @param {DOMList} selected - list of all selected cards to check if a set.
   * @return {Boolean} true if valid set false otherwise.
   */
  function isASet(selected) {
    let attributes = [];
    for (let i = 0; i < selected.length; i++) {
      attributes.push(selected[i].id.split('-'));
    }
    for (let i = 0; i < attributes[0].length; i++) {
      let diff = attributes[0][i] !== attributes[1][i] &&
                attributes[1][i] !== attributes[2][i] &&
                attributes[0][i] !== attributes[2][i];
      let same = attributes[0][i] === attributes[1][i] &&
                    attributes[1][i] === attributes[2][i];
      if (!(same || diff)) {
        return false;
      }
    }
    return true;
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