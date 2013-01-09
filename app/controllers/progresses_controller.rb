class ProgressesController < ApplicationController
  # GET /progresses
  # GET /progresses.json
  def index
    @progresses = Progress.all

    respond_to do |format|
      format.json { render json: @progresses }
    end
  end

  # GET /progresses/1
  # GET /progresses/1.json
  def show
    @progress = Progress.find(params[:id])

    respond_to do |format|
      format.json { render json: @progress }
    end
  end

  # GET /progresses/new
  # GET /progresses/new.json
  def new
    @progress = Progress.new

    respond_to do |format|
      format.json { render json: @progress }
    end
  end

  # GET /progresses/1/edit
  #def edit
  #  @progress = Progress.find(params[:id])
  #end

  # POST /progresses
  # POST /progresses.json
  def create
    @progress = Progress.new(params[:progress])

    respond_to do |format|
      if @progress.save
        format.json { render json: @progress, status: :created, location: @progress }
      else
        format.json { render json: @progress.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /progresses/1
  # PUT /progresses/1.json
  def update
    @progress = Progress.find(params[:id])

    respond_to do |format|
      if @progress.update_attributes(params[:progress])
        format.json { head :no_content }
      else
        format.json { render json: @progress.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /progresses/1
  # DELETE /progresses/1.json
  def destroy
    @progress = Progress.find(params[:id])
    @progress.destroy

    respond_to do |format|
      format.json { head :no_content }
    end
  end
end
