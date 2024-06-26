('use strict');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
    this.calcPace;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevGain) {
    super(coords, distance, duration);
    this.elevGain = elevGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/////////////////////////

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workoutsec');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let workoutEl;

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #markers = {};
  constructor() {
    // get the actual user postion
    this._getPosition();
    // get the data from local storage
    this._getLocalstorage();
    // listenrs
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleelevationfield);
    containerWorkouts.addEventListener(
      'click',
      this._handleWorkoutClick.bind(this)
    );

    containerWorkouts.addEventListener(
      'click',
      this._movemarkertopin.bind(this)
    );
  }
  _getPosition() {
    // ask user and collect location data
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('please activate you location services 👇');
        }
      );
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Event handler click on map
    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(work => this._renderworkoutonmap(work));
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    document.querySelector('.workoutsec').classList.remove('full-height');
    inputDistance.focus();
  }

  _hideForm() {
    form.classList.add('hidden');
    document.querySelector('.workoutsec').classList.add('full-height');
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
  }
  _newWorkout(e) {
    const inputValidation = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    e.preventDefault();

    // get the data from the form

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //if activity is running create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // check if the  inserted data is valide
      if (
        !Number.isFinite(distance) ||
        !Number.isFinite(duration) ||
        !Number.isFinite(cadence) ||
        distance === 0 ||
        duration === 0 ||
        cadence === 0
      ) {
        return alert('Check your inputs');
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }
    //if activity is cycling create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // check if the  inserted data is valide
      // check if the  inserted data is valide
      if (
        !Number.isFinite(distance) ||
        !Number.isFinite(duration) ||
        !Number.isFinite(elevation)
      )
        return alert('Check your inputs ');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //add the new workout to the workout array

    this.#workouts.push(workout);

    //render new workout in the map
    this._renderworkoutonmap(workout);

    //render new workout in the list
    this._renderworkoutlist(workout);

    // hide the form + clear fields
    this._hideForm();

    // save on local storage
    this._setLocalstorage();
  }
  _renderworkoutonmap(workout) {
    const marker = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(workout.description)
      .openPopup();
    this.#markers[workout.id] = marker;
  }

  _renderworkoutlist(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
              <span class="workout__icon">${
                workout.type === 'running' ? '🏃‍♂️' : '🚴'
              }</span>
              <span class="workout__value">${workout.distance}</span>
              <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">⏱</span>
              <span class="workout__value">${workout.duration}</span>
              <span class="workout__unit">min</span>
            </div>`;

    if (workout.type === 'running')
      html += `<div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${Math.trunc(workout.pace)}</span>
              <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">🦶🏼</span>
              <span class="workout__value">${workout.cadence}</span>
              <span class="workout__unit">spm</span>
            </div>`;

    if (workout.type === 'cycling')
      html += `<div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${Math.trunc(workout.speed)}</span>
              <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">🦶🏼</span>
              <span class="workout__value">${workout.elevGain}</span>
              <span class="workout__unit">m</span>
            </div>`;

    html += `
            <div class="workout__menu">
              <span class="workout__menu-icon">⋮</span>
              <div class="workout__menu-dropdown hidden">
                <span class="workout__menu-item" data-action="edit">Edit</span>
                <span class="workout__menu-item" data-action="delete">Delete</span>
                 <span class="workout__menu-item" data-action="deleteAll">Reset</span>
                 <span class="workout__menu-item" data-action="Showall">Showall</span>
                              </div>
            </div>
          </li>`;

    document
      .querySelector('.workoutsec')
      .insertAdjacentHTML('afterbegin', html);
  }

  _toggleelevationfield() {
    inputElevation
      .closest('.form-section')
      .classList.toggle('form__row--hidden');
    inputCadence.closest('.form-section').classList.toggle('form__row--hidden');
  }
  _movemarkertopin(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const workouttozoom = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    if (!workouttozoom || !workouttozoom.coords) return;
    this.#map.setView(workouttozoom.coords, 13);
  }

  _setLocalstorage() {
    localStorage.setItem('workout', JSON.stringify(this.#workouts));
  }

  _getLocalstorage() {
    const data = JSON.parse(localStorage.getItem('workout'));
    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => this._renderworkoutlist(work));
  }
  // handle edit click
  _handleWorkoutClick(e) {
    const menuIcon = e.target.closest('.workout__menu-icon');
    const menuItem = e.target.closest('.workout__menu-item');

    if (menuIcon) {
      const dropdown = menuIcon.nextElementSibling;
      dropdown.classList.toggle('hidden');
    }

    if (menuItem) {
      const action = menuItem.dataset.action;
      const workoutEl = menuItem.closest('.workout');
      const workoutId = workoutEl.dataset.id;

      if (action === 'edit') {
        this._editWorkout(workoutId);
      }

      if (action === 'delete') {
        this._deleteWorkout(workoutId);
      }
      if (action === 'Showall') {
        this._showall();
      }
      if (action === 'deleteAll') {
        this._deleteAllWorkouts();
      }
    }
  }

  // edit  method
  _editWorkout(id) {}
  _showall() {
    const allCoords = this.#workouts.map(work => work.coords);
    if (allCoords.length === 0) return;

    const bounds = L.latLngBounds(allCoords);
    this.#map.fitBounds(bounds);
  }

  // delete method
  _deleteWorkout(id) {
    const workoutIndex = this.#workouts.findIndex(work => work.id === id);
    if (workoutIndex === -1) return;

    // Remove workout from workouts array
    this.#workouts.splice(workoutIndex, 1);

    // Remove marker from map
    const marker = this.#markers[id];

    if (marker) {
      this.#map.removeLayer(marker);

      delete this.#markers[id];
    }

    // Remove workout element from list
    const workoutEl = document.querySelector(`.workout[data-id="${id}"]`);
    if (workoutEl) workoutEl.remove();

    this._setLocalstorage();
  }

  // Clear all workouts
  _deleteAllWorkouts() {
    this.#workouts = [];
    // Remove all markers from the map
    Object.values(this.#markers).forEach(marker => {
      this.#map.removeLayer(marker);
    });

    // Clear the markers object
    this.#markers = {};

    // Remove all workout elements from the list
    document
      .querySelectorAll('.workout')
      .forEach(workoutEl => workoutEl.remove());

    // Clear local storage
    this._setLocalstorage();
  }
}
const app = new App();
