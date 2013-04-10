require 'fileutils'
require 'modules/JSON_patch'

class ExperimentsController < ApplicationController
  skip_before_filter :authenticate_user!, only: [:create]
  skip_authorization_check only: [:create]
  skip_authorize_resource only: [:create]
  skip_load_resource only: [:create]

  def index
    respond_to do |format|
      format.json { render json: [], status: :forbidden }
    end
  end

  def show
    respond_to do |format|
      format.json { render json: [], status: :forbidden }
    end
  end

  def new
    respond_to do |format|
      format.json { render json: [], status: :forbidden }
    end
  end

  EXPERIMENTS_SAVE_DIRECTORY = BawSite::Application.config.custom_experiment_path
  EXPERIMENTS_ASSETS_DIRECTORY = File.join(Rails.root, 'public', 'experiment_assets')
  RAPID_SCAN_COUNTS          = 'rapid_scan_counts.json'
  BIRD_TOUR_COUNTS           = 'bird_tour_counts.json'
  ANNOTATION_RESPONSE_COUNTS = 'bird_tour_annotation_counts.json'

  EXPERIMENTS_SAVE_BIRD_TOUR_DIRECTORY = File.join(EXPERIMENTS_SAVE_DIRECTORY, 'bird_tour')

  def create
    success = nil

    post_data = request.raw_post

    if post_data.blank? || !JSON.is_json?(post_data)
      success = false
    end

    if success.nil?
      FileUtils.makedirs EXPERIMENTS_SAVE_DIRECTORY
      FileUtils.makedirs EXPERIMENTS_SAVE_BIRD_TOUR_DIRECTORY

      if params[:experiment] && params[:experiment] == 'Virtual bird tour experiment'

        File.open(File.join(EXPERIMENTS_SAVE_BIRD_TOUR_DIRECTORY, Time.now.to_f.to_s + '.json'), 'w') { |file|
          file.write post_data
        }

      elsif params[:experiment] && params[:experiment] == 'Rapid Spectrogram Scanning Experiment'

        File.open(File.join(EXPERIMENTS_SAVE_DIRECTORY, Time.now.to_f.to_s + '.json'), 'w') { |file|
          file.write post_data
        }
      else
        raise "Did not save results. Did not get matching experiment name."
      end



      success = true

      if params[:experiment] && params[:experiment] == 'Virtual bird tour experiment'
        if params[:location_species_order]
          update_bird_tour_counts(params[:location_species_order])
        else
          raise "No code found in json for update_bird_tour_counts!"
        end

        if params[:steps]
          bird_tour_annotation_counts(params[:steps])
        else
          raise "No code found in json for update_bird_tour_counts!"
        end
      end

      if params[:experiment] && params[:experiment] == 'Rapid Spectrogram Scanning Experiment'
        if params[:code]
          update_rapid_scan_counts(params[:code])
        else
          raise "No code found in json packet!"
        end

      end
    end

    respond_to do |format|
      if success
        format.json { render json: [], status: :created }
      else
        format.json { render json: [], status: :unprocessable_entity }
      end
    end
  end


  def load
    # get current bird tour counts
    load_bird_tour_counts()
  end

  def update
    respond_to do |format|
      format.json { render json: [], status: :forbidden }
    end
  end


  def destroy
    respond_to do |format|
      format.json { render json: [], status: :forbidden }
    end
  end

  private

  def update_rapid_scan_counts(code)
    # open file
    filename                                   = File.join(EXPERIMENTS_ASSETS_DIRECTORY, RAPID_SCAN_COUNTS)
    file_contents                              = File.open(filename, 'r') { |file| file.read }

    # parse JSON
    counts                                     = JSON.parse(file_contents)
    # modify JSON
    current                                    = counts[code]["count"]
    current                                    = current + 1
    counts[code]["count"] = current

    # write JSON
    json_output                                = JSON.pretty_generate(counts)

    File.open(filename, 'w') { |file| file.write json_output }

  end

  # updates counts for how many times the location and species orders have been completed.
  def update_bird_tour_counts(order)
    # open file
    filename                                   = File.join(EXPERIMENTS_ASSETS_DIRECTORY, BIRD_TOUR_COUNTS)
    file_contents                              = File.open(filename, 'r') { |file| file.read }

    # parse JSON
    counts                                     = JSON.parse(file_contents)

    # modify JSON
    # increment location order counts
    location_order_code = order[:locations].join('').to_s

    current = counts['locations'][location_order_code]['count']
    current = current + 1
    counts['locations'][location_order_code]['count'] = current

    # increment species order counts
    order[:species].each { |key, value|
      species_key = key.to_s
      species_value = value.join('')
      if counts['species'].has_key?(species_key)
        current = counts['species'][species_key][species_value]['count']
        current = current + 1
        counts['species'][species_key][species_value]['count'] += current
      end
    }

    # write JSON
    json_output                                = JSON.pretty_generate(counts)

    File.open(filename, 'w') { |file| file.write json_output }
  end

  # updates counts for annotation responses - yes, no, unsure
  def bird_tour_annotation_counts(steps)
    # open file
    filename                                   = File.join(EXPERIMENTS_ASSETS_DIRECTORY, ANNOTATION_RESPONSE_COUNTS)
    file_contents                              = File.open(filename, 'r') { |file| file.read }

    # parse JSON
    counts                                     = JSON.parse(file_contents)

    # modify JSON
    # pull out the responses for each annotations, and increment the response counts
    steps.each do |step|
      if step.has_key?(:responses)
      # check that the step contains responses, transitions will not
      step[:responses].each do |annotation_id, response|
        new_annotation_id = annotation_id.gsub('response','')
        unless counts.keys.any? { |key| key == new_annotation_id }
          # add the annotation id to the store if it is not already in there
          counts[new_annotation_id] = { 'no' => 0, 'yes' => 0, 'unsure' => 0, 'total' => 0 }
        end

        # increment the response count for each response given: yes, no, or unsure.
        counts[new_annotation_id][response.to_s] += 1
        counts[new_annotation_id]['total'] += 1
      end
      end
    end

    # write JSON
    json_output                                = JSON.pretty_generate(counts)

    File.open(filename, 'w') { |file| file.write json_output }
  end

end
