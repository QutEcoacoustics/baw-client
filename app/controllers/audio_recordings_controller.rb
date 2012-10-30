class AudioRecordingsController < ApplicationController
  # GET /audio_recordings
  # GET /audio_recordings.json
  def index
    @audio_recordings = AudioRecording.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @audio_recordings }
    end
  end

  # GET /audio_recordings/1
  # GET /audio_recordings/1.json
  def show
    @audio_recording = AudioRecording.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @audio_recording }
    end
  end

  # GET /audio_recordings/new
  # GET /audio_recordings/new.json
  def new
    @audio_recording = AudioRecording.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @audio_recording }
    end
  end

  # GET /audio_recordings/1/edit
  def edit
    @audio_recording = AudioRecording.find(params[:id])
  end

  # POST /audio_recordings
  # POST /audio_recordings.json
  def create
    @audio_recording = AudioRecording.new(params[:audio_recording])

    respond_to do |format|
      if @audio_recording.save
        format.html { redirect_to @audio_recording, notice: 'Audio recording was successfully created.' }
        format.json { render json: @audio_recording, status: :created, location: @audio_recording }
      else
        format.html { render action: "new" }
        format.json { render json: @audio_recording.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /audio_recordings/1
  # PUT /audio_recordings/1.json
  def update
    @audio_recording = AudioRecording.find(params[:id])

    respond_to do |format|
      if @audio_recording.update_attributes(params[:audio_recording])
        format.html { redirect_to @audio_recording, notice: 'Audio recording was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @audio_recording.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /audio_recordings/1
  # DELETE /audio_recordings/1.json
  def destroy
    @audio_recording = AudioRecording.find(params[:id])
    @audio_recording.destroy

    respond_to do |format|
      format.html { redirect_to audio_recordings_url }
      format.json { head :no_content }
    end
  end
end
