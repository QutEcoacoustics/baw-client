class ProjectsController < ApplicationController


  # GET /projects
  # GET /projects.json
  def index
    @projects = Project.all

    respond_to do |format|
      format.json { render json: @projects }
    end
  end

  # GET /projects/1
  # GET /projects/1.json
  def show
    @project = Project.find(params[:id])

    respond_to do |format|
      format.json { render json: @project }
    end
  end

  # GET /projects/new
  # GET /projects/new.json
  def new
    @project = Project.new
    @project.sites.build
    #@all_sites = Site.all

    respond_to do |format|
      format.json { render json: @project }
    end
  end

  # GET /projects/1/edit
  #def edit
  #  @project = Project.find(params[:id])
  #@all_sites = Site.all
  #end

  # POST /projects
  # POST /projects.json
  def create
    @project = Project.new(params[:project])

    respond_to do |format|
      if @project.save
        format.json { render json: @project, status: :created, location: @project }
      else
        format.json { render json: @project.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /projects/1
  # PUT /projects/1.json
  # http://stackoverflow.com/questions/10743784/ruby-on-rails-multi-selector-with-many-to-many-relation
  # http://www.nearinfinity.com/blogs/jim_clark/activerecord_nested_attributes.html
  # http://iqbalfarabi.net/2011/01/20/rails-nested-form-with-has-many-through-association/
  def update
    @project = Project.find(params[:id])
	
	#ProjectSite.find(2).destroy
	
    respond_to do |format|
      if @project.update_attributes(params[:project])
        format.json { head :no_content }
      else
        format.json { render json: @project.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /projects/1
  # DELETE /projects/1.json
  def destroy
    @project = Project.find(params[:id])
    @project.destroy

    respond_to do |format|
      format.json { head :no_content }
    end
  end
end
