import axios from 'axios';
import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';
import './styles.css';

const API_KEY = '54988487-8c311aa070ee18677b711e05e';
const BASE_URL = 'https://pixabay.com/api/';
const PER_PAGE = 40;

const form = document.getElementById('search-form');
const gallery = document.getElementById('gallery');
const loader = document.getElementById('loader');
const loadMoreBtn = document.getElementById('load-more');

let currentQuery = '';
let currentPage = 1;
let totalHits = 0;
let lightbox = null;

// ── Helpers ──────────────────────────────────────────────
function showLoader() { loader.hidden = false; }
function hideLoader() { loader.hidden = true; }
function showLoadMore() { loadMoreBtn.hidden = false; }
function hideLoadMore() { loadMoreBtn.hidden = true; }
function clearGallery() { gallery.innerHTML = ''; }

function renderImages(images) {
  const markup = images.map(({ webformatURL, largeImageURL, tags, likes, views, comments, downloads }) => `
    <li class="gallery-item">
      <a href="${largeImageURL}">
        <img class="gallery-img" src="${webformatURL}" alt="${tags}" loading="lazy" />
      </a>
      <div class="image-info">
        <div class="info-item">
          <span class="info-label">Likes</span>
          <span class="info-value">${likes}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Views</span>
          <span class="info-value">${views}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Comments</span>
          <span class="info-value">${comments}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Downloads</span>
          <span class="info-value">${downloads}</span>
        </div>
      </div>
    </li>`).join('');

  gallery.insertAdjacentHTML('beforeend', markup);

  if (lightbox) {
    lightbox.refresh();
  } else {
    lightbox = new window.SimpleLightbox('.gallery a', {
      captionsData: 'alt',
      captionDelay: 250,
    });
  }
}

function smoothScroll() {
  const card = gallery.querySelector('.gallery-item');
  if (!card) return;
  const { height } = card.getBoundingClientRect();
  window.scrollBy({ top: height * 2, behavior: 'smooth' });
}

function checkEndOfResults() {
  const loaded = gallery.querySelectorAll('.gallery-item').length;
  if (loaded >= totalHits) {
    hideLoadMore();
    iziToast.info({
      message: "We're sorry, but you've reached the end of search results.",
      position: 'bottomCenter',
    });
  }
}

// ── API ──────────────────────────────────────────────────
async function fetchImages(query, page) {
  const { data } = await axios.get(BASE_URL, {
    params: {
      key: API_KEY,
      q: query,
      image_type: 'photo',
      orientation: 'horizontal',
      safesearch: true,
      per_page: PER_PAGE,
      page,
    },
  });
  return data;
}

// ── Form submit ──────────────────────────────────────────
form.addEventListener('submit', async e => {
  e.preventDefault();
  const query = e.target.query.value.trim();
  if (!query) return;

  currentQuery = query;
  currentPage = 1;

  clearGallery();
  hideLoadMore();
  showLoader();

  try {
    const data = await fetchImages(currentQuery, currentPage);
    hideLoader();
    totalHits = data.totalHits;

    if (data.hits.length === 0) {
      iziToast.error({
        message: 'Sorry, there are no images matching your search query. Please try again!',
        position: 'topRight',
        backgroundColor: '#EF4040',
        messageColor: '#fff',
        iconColor: '#fff',
        progressBarColor: '#B51B1B',
      });
      return;
    }

    renderImages(data.hits);

    if (data.hits.length < totalHits) {
      showLoadMore();
    }
  } catch {
    hideLoader();
    iziToast.error({
      message: 'Something went wrong. Please try again later.',
      position: 'topRight',
    });
  }
});

// ── Load more ────────────────────────────────────────────
loadMoreBtn.addEventListener('click', async () => {
  currentPage += 1;
  hideLoadMore();
  showLoader();

  try {
    const data = await fetchImages(currentQuery, currentPage);
    hideLoader();
    renderImages(data.hits);
    smoothScroll();
    checkEndOfResults();

    if (gallery.querySelectorAll('.gallery-item').length < totalHits) {
      showLoadMore();
    }
  } catch {
    hideLoader();
    iziToast.error({
      message: 'Something went wrong. Please try again later.',
      position: 'topRight',
    });
  }
});
