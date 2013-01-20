# http://stackoverflow.com/a/9361331/224512

    module JSON
      def self.is_json?(foo)
        begin
          return false unless foo.is_a?(String)
          JSON.parse(foo).all?
        rescue JSON::ParserError
          false
        end
      end
    end
