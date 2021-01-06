<?php
$to ="souvikdeb26@gmail.com"
$subject ="New potfolio message";  

$name=$_POST['name'];
$email=$_POST['email'];
$message =$_POST['message'];

    // $mail_from='deb.souvik2612@gmail.com';
    
    // $email_body="Username: $name.\n".
    //             "User Email: $email.\n".
    //             "User Message: $message.\n";

    
$headers .= "Content-Type: text/html;\r\n";
$headers .="From: $email\r\n";

mail($to,$subject,$message,$headers);
// header("Location:index.html");



?>