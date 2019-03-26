<html>
<?php
$username =  $_POST["username"];
$password = $_POST["password"];
$email = $_POST["email"];
$con = mysqli_connect('localhost', 'user', 'password','mysql') or die("Coudn't connect!");
$result = mysqli_query($con, "select* from investor");
$flag = 0;
while($row = $result->fetch_assoc()){
    if($row["username"]==$username){
        $flag = -1;
        break;
    }
}
if($flag == 0){
$sql = "insert into investor values('".$username."','".$email."','".$password."')";
$query = mysqli_query($con, $sql);
$sql = "insert into investoraccount values('".$username."',100000,100000,100000)";
$query = mysqli_query($con, $sql);
$myDomain = ereg_replace("^[^.]*.([^.]*).(.*)$", '1.2', $_SERVER['HTTP_HOST']);
$setDomain = ($_SERVER['HTTP_HOST']) != "localhost" ? ".$myDomain" : false;
setcookie ("loggedin", 'true', time()+3600*24*(2), '/', "$setDomain", 0 );
setcookie ("username", $username, time()+3600*24*(2), '/', "$setDomain", 0 );
header("Location: http://localhost:3500/home");
}
else{
header("Location: http://localhost/stock-simulator/#");
}
?>
</html>
