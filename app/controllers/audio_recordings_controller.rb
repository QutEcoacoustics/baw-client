class AudioRecordingsController < ApplicationController
  # GET /audio_recordings
  # GET /audio_recordings.json
  def index
    @audio_recordings = AudioRecording.all

    respond_to do |format|
      format.json { render json: @audio_recordings }
    end
  end

  # GET /audio_recordings/1
  # GET /audio_recordings/1.json
  def show
    @audio_recording = AudioRecording.find(params[:id])

    respond_to do |format|
      format.json { render json: @audio_recording }
    end
  end

  # GET /audio_recordings/new
  # GET /audio_recordings/new.json
  def new
    @audio_recording = AudioRecording.new

    respond_to do |format|
      format.json { render json: @audio_recording }
    end
  end

  # GET /audio_recordings/1/edit
  #def edit
  #  @audio_recording = AudioRecording.find(params[:id])
  #end

  # POST /audio_recordings
  # POST /audio_recordings.json
  def create
    @audio_recording = AudioRecording.new(params[:audio_recording])

    respond_to do |format|
      if @audio_recording.save
        format.json { render json: @audio_recording, status: :created, location: @audio_recording }
      else
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
        format.json { head :no_content }
      else
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
      format.json { head :no_content }
    end
  end

  # this is called by the harvester once the audio file is in the correct location
  def upload_complete
    @audio_recording = AudioRecording.find(params[:id])
    params_ar = params[:audio_recording]
    if !@audio_recording.blank? && @audio_recording.file_hash == params_ar[:file_hash] &&
        @audio_recording.uuid == params_ar[:uuid] && @audio_recording.status == 'new'
      # update audio recording from 'new' to 'to_check'
      @audio_recording.status = :to_check
      @audio_recording.save!
      head :ok
    else
      head :bad_request
    end
  end
end
