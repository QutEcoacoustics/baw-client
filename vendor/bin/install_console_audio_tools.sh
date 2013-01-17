sudo apt-key del 16126D3A3E5C1192
sudo apt-get update
sudo apt-key finger
sudo apt-key adv --recv-keys --keyserver keyserver.ubuntu.com 16126D3A3E5C1192
sudo apt-get update
sudo apt-get install ffmpeg mp3splt sox wavpack --fix-missing
sudo apt-get update

# http://askubuntu.com/a/86445 apt-get clean            # Remove cached packages
cd /var/lib/apt
mv lists lists.old       # Backup mirror info
mkdir -p lists/partial   # Recreate directory structure
apt-get clean
apt-get update           # Fetch mirror info
sudo apt-key finger