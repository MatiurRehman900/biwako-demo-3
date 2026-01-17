emailjs.init('YOUR_PUBLIC_KEY');

document.getElementById('contact_form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const templateParams = {
        from_name: document.getElementById('name').value,
        from_email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        country: document.getElementById('country').value,
        message: document.getElementById('message').value,
        to_email: 'mati.rehman054@gmail.com'
    };
    
    emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
        .then(function(response) {
            document.getElementById('success_message').style.display = 'block';
            document.getElementById('error_message').style.display = 'none';
            document.getElementById('contact_form').reset();
        }, function(error) {
            document.getElementById('error_message').style.display = 'block';
            document.getElementById('success_message').style.display = 'none';
        });
});