document.getElementById('ride-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const pickup = document.getElementById('pickup').value;
    const dropoff = document.getElementById('dropoff').value;
    const carType = document.getElementById('car-type').value;
    const notes = document.getElementById('notes').value;

    const response = await fetch('/api/request-ride', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, phone, pickup, dropoff, carType, notes })
    });

    if (response.ok) {
        alert('Ride requested successfully!');
    } else {
        alert('Error requesting ride');
    }
});

