class AnalysisScriptsController < ApplicationController
  # GET /analysis_scripts
  # GET /analysis_scripts.json
  def index
    @analysis_scripts = AnalysisScript.all

    respond_to do |format|
      format.json { render json: @analysis_scripts }
    end
  end

  # GET /analysis_scripts/1
  # GET /analysis_scripts/1.json
  def show
    @analysis_script = AnalysisScript.find(params[:id])

    respond_to do |format|
      format.json { render json: @analysis_script }
    end
  end

  # GET /analysis_scripts/new
  # GET /analysis_scripts/new.json
  def new
    @analysis_script = AnalysisScript.new

    respond_to do |format|
      format.json { render json: @analysis_script }
    end
  end

  # GET /analysis_scripts/1/edit
  #def edit
  #  @analysis_script = AnalysisScript.find(params[:id])
  #end

  # POST /analysis_scripts
  # POST /analysis_scripts.json
  def create
    @analysis_script = AnalysisScript.new(params[:analysis_script])

    respond_to do |format|
      if @analysis_script.save
        format.json { render json: @analysis_script, status: :created, location: @analysis_script }
      else
        format.json { render json: @analysis_script.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /analysis_scripts/1
  # PUT /analysis_scripts/1.json
  def update
    @analysis_script = AnalysisScript.find(params[:id])

    respond_to do |format|
      if @analysis_script.update_attributes(params[:analysis_script])
        format.json { head :no_content }
      else
        format.json { render json: @analysis_script.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /analysis_scripts/1
  # DELETE /analysis_scripts/1.json
  def destroy
    @analysis_script = AnalysisScript.find(params[:id])
    @analysis_script.destroy

    respond_to do |format|
      format.json { head :no_content }
    end
  end
end
