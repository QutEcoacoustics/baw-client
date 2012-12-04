class AudioEventsController < ApplicationController
  # GET /audio_events
  # GET /audio_events.json
  def index
    if params[:by_audio_id]
      return by_audio_id
    end

    @audio_events = AudioEvent.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @audio_events }
    end
  end

  def by_audio_id
    # TODO: check if quid
    id = params[:by_audio_id]

    @audio_events =
        AudioEvent
        .includes(:audio_recording)
        .where(:audio_recordings => { :uuid => id })


    #@audio_recording  = (AudioRecording.find_by_uuid id)
    #@audio_events = AudioEvent.find_all_by_audio_recording_id  @audio_recording.id

    #@audio_events =
    #    (AudioRecording)
    #    .select([:id, :uuid])
    #    .joins(:@audio_events)
    #    .where(:audio_recordings => {:uuid => id})

    #@formatted_events = @audio_events.collect{ |audio_event|
    #  {
    #      :high_freq => audio_event.high_frequency_hertz,
    #      :id => audio_event.audio_recording.id,
    #      :site => audio_event.audio_recording.site.name,
    #} }

    # :include => [{ :sites => { :only => [ :id, :name ] } }
    respond_to do |format|
      format.json { render json: @audio_events }
      format.xml { render xml: @audio_events }
    end
  end

  # GET /audio_events/1
  # GET /audio_events/1.json
  def show
    @audio_event = AudioEvent.includes(:audio_event_tags).find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @audio_event }
    end
  end

  # GET /audio_events/new
  # GET /audio_events/new.json
  def new
    @audio_event = AudioEvent.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @audio_event }
    end
  end

  # GET /audio_events/1/edit
  def edit
    @audio_event =
        AudioEvent.find(params[:id]).includes(:audio_event_tags)
  end

  # POST /audio_events
  # POST /audio_events.json
  def create
    @audio_event = AudioEvent.new(params[:audio_event])
    #@audio_event.audio_event_tags.each{ |aet|  aet.build() }

    #@audio_event.audio_event_tags.count.times { @audio_event.audio_event_tags.build }

    respond_to do |format|
      if @audio_event.save!
        #@audio_event.audio_event_tags.reload
        format.json { render json: @audio_event, status: :created, location: @audio_event }
      else
        format.json { render json: @audio_event.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /audio_events/1
  # PUT /audio_events/1.json
  def update
    @audio_event = AudioEvent.find(params[:id])

    respond_to do |format|
      if @audio_event.update_attributes(params[:audio_event])
        format.html { redirect_to @audio_event, notice: 'Audio event was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @audio_event.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /audio_events/1
  # DELETE /audio_events/1.json
  def destroy
    @audio_event = AudioEvent.find(params[:id])
    @audio_event.destroy

    respond_to do |format|
      format.html { redirect_to audio_events_url }
      format.json { head :no_content }
    end
  end

  def download

    @formatted_annotations =
        custom_format AudioEvent.includes(:tags).order(:audio_event => :recorded_date).all

    respond_to do |format|
      format.xml { render :xml => @formatted_annotations  }
      format.json { render :json => @formatted_annotations }
      format.csv  {
        time_now = Time.zone.now
        render_csv("annotations-#{time_now.strftime("%Y%m%d")}-#{time_now.strftime("%H%M%S")}")
}
    end
  end

  private

  def custom_format(annotations)

    list = []

    annotations.each do |annotation|

      annotation_items = [
          annotation[:id],
          annotation.audio_recording.recorded_date.advance(:seconds => annotation[:start_time_seconds]).strftime('%Y/%m/%d'),
          annotation.audio_recording.recorded_date.advance(:seconds => annotation[:start_time_seconds]).strftime('%H:%M:%S'),
          annotation.audio_recording.recorded_date.advance(:seconds => annotation[:end_time_seconds]).strftime('%Y/%m/%d'),
          annotation.audio_recording.recorded_date.advance(:seconds => annotation[:end_time_seconds]).strftime('%H:%M:%S'),
          annotation[:high_frequency_hertz], annotation[:low_frequency_hertz],
          annotation.audio_recording.site.projects.collect{ |project| project.id }.join(' | '),
          annotation.audio_recording.site.id,
          annotation.audio_recording.uuid,
          annotation.creator_id,
          'http://localhost:3000/'
      ]

      annotation.tags.each do |tag|
        annotation_items.push  tag[:id], tag[:text],tag[:type_of_tag], tag[:is_taxanomic]
      end

      list.push annotation_items
    end

    list
  end
end
