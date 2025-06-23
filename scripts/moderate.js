// Storage - Fetch from persistent storage
const populateFormInputs = (data) => {
    // Populate API key
    if (data.apiKey) {
        const apiKeyInput = document.getElementById('api-key');
        if (apiKeyInput) apiKeyInput.value = data.apiKey;
    }

    // Populate text content
    if (data.text) {
        const textInput = document.getElementById('text-content');
        if (textInput) textInput.value = data.text;
    }

    // Populate image URLs
    if (data.imageUrls && data.imageUrls.length > 0) {
        const imageUrlList = document.getElementById('image-url-list');
        if (imageUrlList) {
            // Clear existing URLs
            imageUrlList.innerHTML = '';

            // Add each saved URL
            data.imageUrls.forEach((url, index) => {
                const urlItem = document.createElement('div');
                urlItem.className = 'url-item';
                urlItem.innerHTML = `
                    <input type="url" id="image-url-${index + 1}" value="${url}" placeholder="https://example.com/image.jpg" required>
                    <button type="button" class="remove-url">x</button>
                `;

                // Add remove functionality
                urlItem.querySelector('.remove-url').addEventListener('click', () => {
                    urlItem.remove();
                });

                imageUrlList.appendChild(urlItem);
            });
        }
    }
};

// Storage - Save form data to persistent storage
const saveFormData = async (data) => {
    try {
        await window.electronAPI.saveFormData(data);
    } catch (error) {
        console.error('Failed to save:', error);
    }
};

// Inputs - Get all form inputs and save to storage
const getAllInputs = (saveToStorage = () => {}) => {
    const apiKeyInput = document.getElementById('api-key');
    const textInput = document.getElementById('text-content');
    const imageUrlList = document.getElementById('image-url-list');
    const imageUrlInputs = Array.from(imageUrlList.querySelectorAll('input[type="url"]'));

    const data = {
        apiKey: apiKeyInput ? apiKeyInput.value.trim() : '',
        text: textInput ? textInput.value.trim() : '',
        imageUrls: imageUrlInputs.map(input => input.value.trim()).filter(url => url)
    };

    // Save to storage
    saveToStorage(data);

    return {
        ...data
    };
}

const moderateText = async (bearerToken, text, options = {}) => {
    return moderate(bearerToken, {
        clientId: `text-${Date.now()}`,
        name: options.name || 'Text Content',
        entity: 'text',
        content: { text },
        passthrough: true,
        ...options
    });
}

const moderateImages = async (bearerToken, imageUrls, options = {}) => {
    return moderate(bearerToken, {
        clientId: `images-${Date.now()}`,
        name: options.name || 'Image Content',
        entity: 'images',
        content: {
            text: '',
            imageUrls: Array.isArray(imageUrls) ? imageUrls : [imageUrls]
        },
        passthrough: true,
        ...options
    });
}

const moderate = async (bearerToken, data) => {
    const response = await fetch(IFFY_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
        console.error('API Error:', result);
        const errorDetails = {
            status: response.status,
            statusText: response.statusText,
            error: result.error || result.message || 'Unknown error',
            details: result
        };
        throw new Error(JSON.stringify(errorDetails));
    }
    return result;
};

const handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.target;
    const formId = form.id;
    const inputs = getAllInputs(saveFormData);

    const getResultBox = (formId) => {
        switch (formId) {
            case 'text-form':
                return document.getElementById('text-results');
            case 'images-form':
                return document.getElementById('images-results');
            default:
                return undefined;
        }
    };

    const resultBox = getResultBox(formId);

    try {
        resultBox.innerHTML = '<p>Processing...</p>';
        resultBox.classList.add('show');

        switch (formId) {
            case 'text-form': {
                if (!inputs.apiKey) throw new Error('API key is required');
                if (!inputs.text) throw new Error('Text content is required');

                const result = await moderateText(inputs.apiKey, inputs.text);
                displayResults(resultBox, result);
                break;
            }
            case 'images-form': {
                if (!inputs.apiKey) throw new Error('API key is required');
                if (inputs.imageUrls.length === 0) throw new Error('At least one URL is required');

                const result = await moderateImages(inputs.apiKey, inputs.imageUrls);
                displayResults(resultBox, result);
                break;
            }
            default:
                throw new Error(`Unknown form: ${formId}`);
        }
    } catch (error) {
        displayError(resultBox, error);
    }
};

const displayResults = (resultBox, result) => {
    resultBox.innerHTML = `
        <h3>Moderation Result</h3>
        <section>
            <b>Status: ${result.status || 'Unknown'}</b>
        </section>
        <section>
            <pre>${JSON.stringify(result, null, 2)}</pre>
        </section>
    `;
};

const displayError = (resultBox, error) => {
    let errorMessage;
    try {
        const errorObj = JSON.parse(error.message);
        errorMessage = `
            <div style="color: #c62828;">
                <h4>API Error (${errorObj.status})</h4>
                <p><strong>Error:</strong> ${errorObj.error}</p>
                <details>
                    <summary>Full Error Details</summary>
                    <pre>${JSON.stringify(errorObj.details, null, 2)}</pre>
                </details>
            </div>
        `;
    } catch {
        errorMessage = `<p style="color: #c62828;"><strong>Error:</strong> ${error.message}</p>`;
    }
    resultBox.innerHTML = errorMessage;
};

const IFFY_API_URL = document.querySelector('.api-endpoint-section input[type="url"]').value;

// Listeners - Load persistent data on DOM load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const result = await window.electronAPI.loadFormData();

        if (result.success && result.data) {
            populateFormInputs(result.data);
        }
    } catch (error) {
        console.error('Failed to load form data:', error);
    }
});

// Listeners - Add new image URL input
document.querySelector('.add-url').addEventListener('click', function() {
    const urlList = document.querySelector('.url-list');
    const newItem = document.createElement('div');
    newItem.className = 'url-item';
    newItem.innerHTML = `
        <div class="url-item">
        <input type="url" placeholder="https://example.com/image.jpg" required>
        <button type="button" class="remove-url">x</button>
        </div>
    `;

    // Append the new item to the list
    urlList.appendChild(newItem);

    // Add event listener to the remove button
    newItem.querySelector('.remove-url').addEventListener('click', () => {
        newItem.remove();
    });
});

// Listeners - Handle text moderation submission
document.querySelector('.text-section form').addEventListener('submit', handleSubmit);

// Listeners - Handle image moderation submission
document.querySelector('.images-section form').addEventListener('submit', handleSubmit);