echo "Installing audio tools"
sudo apt-get update -qq
# sudo apt-get upgrade
# sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-key 16126D3A3E5C1192
sudo apt-get install ffmpeg mp3splt sox wavpack --fix-missing

echo "testing for audio tools"
ffmpeg -version
mp3splt -version
sox --version
wvunpack
