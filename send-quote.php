<?php
if ($_POST) {
    $name = $_POST['name'];
    $email = $_POST['email'];
    $phone = $_POST['phone'];
    $country = $_POST['country'];
    $message = $_POST['message'];
    
    $to = "mati.rehman054@gmail.com";
    $subject = "New Quote Request from " . $name;
    
    $body = "New quote request received:\n\n";
    $body .= "Name: " . $name . "\n";
    $body .= "Email: " . $email . "\n";
    $body .= "Phone: " . $phone . "\n";
    $body .= "Country: " . $country . "\n";
    $body .= "Parts Required: " . $message . "\n";
    
    $headers = "From: " . $email . "\r\n";
    $headers .= "Reply-To: " . $email . "\r\n";
    
    if (mail($to, $subject, $body, $headers)) {
        echo "success";
    } else {
        echo "error";
    }
}
?>