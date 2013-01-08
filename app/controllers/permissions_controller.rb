class PermissionsController < ApplicationController
  # GET /permissions
  # GET /permissions.json
  def index
    @permissions = Permission.all

    respond_to do |format|
      format.json { render json: @permissions }
    end
  end

  # GET /permissions/1
  # GET /permissions/1.json
  def show
    @permission = Permission.find(params[:id])

    respond_to do |format|
      format.json { render json: @permission }
    end
  end

  # GET /permissions/new
  # GET /permissions/new.json
  def new
    @permission = Permission.new

    respond_to do |format|
      format.json { render json: @permission }
    end
  end

  # GET /permissions/1/edit
  #def edit
  #  @permission = Permission.find(params[:id])
  #end

  # POST /permissions
  # POST /permissions.json
  def create
    @permission = Permission.new(params[:permission])

    respond_to do |format|
      if @permission.save
        format.json { render json: @permission, status: :created, location: @permission }
      else
        format.json { render json: @permission.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /permissions/1
  # PUT /permissions/1.json
  def update
    #@permission = Permission.find(params[:id])
    #
    #respond_to do |format|
    #  if @permission.update_attributes(params[:permission])
    #    format.json { head :no_content }
    #  else
    #    format.json { render json: @permission.errors, status: :unprocessable_entity }
    #  end
    #end

    respond_to do |format|
      format.json { head :bad_request }
    end
  end

  # DELETE /permissions/1
  # DELETE /permissions/1.json
  def destroy
    @permission = Permission.find(params[:id])
    @permission.destroy

    respond_to do |format|
      format.json { head :no_content }
    end
  end
end
