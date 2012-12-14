class AnalysisItemsController < ApplicationController
  # GET /analysis_items
  # GET /analysis_items.json
  def index
    @analysis_items = AnalysisItem.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @analysis_items }
    end
  end

  # GET /analysis_items/1
  # GET /analysis_items/1.json
  def show
    @analysis_item = AnalysisItem.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @analysis_item }
    end
  end

  # GET /analysis_items/new
  # GET /analysis_items/new.json
  def new
    @analysis_item = AnalysisItem.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @analysis_item }
    end
  end

  # GET /analysis_items/1/edit
  def edit
    @analysis_item = AnalysisItem.find(params[:id])
  end

  # POST /analysis_items
  # POST /analysis_items.json
  def create
    @analysis_item = AnalysisItem.new(params[:analysis_item])

    respond_to do |format|
      if @analysis_item.save
        format.html { redirect_to @analysis_item, notice: 'Analysis item was successfully created.' }
        format.json { render json: @analysis_item, status: :created, location: @analysis_item }
      else
        format.html { render action: "new" }
        format.json { render json: @analysis_item.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /analysis_items/1
  # PUT /analysis_items/1.json
  def update
    @analysis_item = AnalysisItem.find(params[:id])

    respond_to do |format|
      if @analysis_item.update_attributes(params[:analysis_item])
        format.html { redirect_to @analysis_item, notice: 'Analysis item was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @analysis_item.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /analysis_items/1
  # DELETE /analysis_items/1.json
  def destroy
    @analysis_item = AnalysisItem.find(params[:id])
    @analysis_item.destroy

    respond_to do |format|
      format.html { redirect_to analysis_items_url }
      format.json { head :no_content }
    end
  end
end
