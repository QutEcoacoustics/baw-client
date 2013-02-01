class AnalysisJobsController < ApplicationController
  # GET /analysis_jobs
  # GET /analysis_jobs.json
  def index
    @analysis_jobs = AnalysisJob.all

    respond_to do |format|
      format.json { render json: @analysis_jobs }
    end
  end

  # GET /analysis_jobs/1
  # GET /analysis_jobs/1.json
  def show
    @analysis_job = AnalysisJob.find(params[:id])

    respond_to do |format|
      format.json { render json: @analysis_job }
    end
  end

  # GET /analysis_jobs/new
  # GET /analysis_jobs/new.json
  def new
    @analysis_job = AnalysisJob.new

    respond_to do |format|
      format.json { render json: @analysis_job }
    end
  end

  # GET /analysis_jobs/1/edit
  #def edit
  #  @analysis_job = AnalysisJob.find(params[:id])
  #end

  # POST /analysis_jobs
  # POST /analysis_jobs.json
  def create
    @analysis_job = AnalysisJob.new(params[:analysis_job])

    respond_to do |format|
      if @analysis_job.save
        format.json { render json: @analysis_job, status: :created, location: @analysis_job }
      else
        format.json { render json: @analysis_job.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /analysis_jobs/1
  # PUT /analysis_jobs/1.json
  def update
    @analysis_job = AnalysisJob.find(params[:id])

    respond_to do |format|
      if @analysis_job.update_attributes(params[:analysis_job])
        format.json { head :no_content }
      else
        format.json { render json: @analysis_job.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /analysis_jobs/1
  # DELETE /analysis_jobs/1.json
  def destroy
    @analysis_job = AnalysisJob.find(params[:id])
    @analysis_job.destroy

    add_archived_at_header @analysis_job

    respond_to do |format|
      format.json { no_content_as_json }
    end
  end
end
