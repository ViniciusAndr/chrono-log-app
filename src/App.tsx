import { subDays, addDays, format, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { writeText as writeToClipboard } from '@tauri-apps/api/clipboard';
import { chronoApi } from "./api/chrono";

interface IActivity {
  id: string,
  date: string,
  startTime: string,
  endTime?: string,
  description: string
}

const date_now = new Date();

export function App() {
  const [time, setTime] = useState(format(date_now, "HH:mm:ss"));
  const [filterData, setFilterData] = useState(date_now)
  const [message, setMessage] = useState("")
  const [isMessageEmpty, setIsMessageEmpty] = useState(false);
  const [activities, setActivities] = useState<Array<IActivity>>([])

  async function handleNewActivitie() {

    if (message === "") {
      setIsMessageEmpty(true)
      toast.error("Message is required!")
      return
    }

    if (!isToday(filterData)) {
      toast.error("You can only mark activities for today!")
      return;
    }

    let activitiesToUpdate = activities;

    let activityToUpdate = activitiesToUpdate[activities.length - 1];

    if (activityToUpdate) {
      activityToUpdate.endTime = format(new Date(), "HH:mm");

      await chronoApi.put(`/activity/finish/${activityToUpdate.id}`)
        .then(res => {
          if (res.status !== 200) {
            toast.error("Error to update activity!");
            throw res.data
          }

        })
        .catch(err => {
          toast.error("Error to update last activity");
          throw err
        });
    }

    var newAct: IActivity = {
      id: crypto.randomUUID(),
      date: format(date_now, "dd/MM/yyyy"),
      startTime: format(new Date(), "HH:mm"),
      description: "SMS - " + message
    }

    await chronoApi.post("/activity/new", newAct)
      .then(res => {
        if (res.status === 200)
          toast.success("Activity saved!")
        else {
          toast.error("Error to save activity!");
          return;
        }
      })
      .catch(err => {
        toast.error("Error when calling API!")
        throw err
      });

    setActivities([...activitiesToUpdate, newAct])
    setMessage("");
  }

  async function handleCopyMessage(description: string) {
    writeToClipboard(description)
    navigator.clipboard.writeText(description)
  }

  async function syncActivitiesList() {

    const { data } = await chronoApi.get(`?date=${format(filterData, "dd/MM/yyyy")}`)
    setActivities(data)
  }

  useEffect(() => {
    syncActivitiesList()
  }, [filterData])

  useEffect(() => {
    syncActivitiesList()

    setInterval(() => {
      const _time = format(new Date(), "HH:mm:ss");
      setTime(_time);
    }, 1000);

  }, []);

  return (
    <div className="flex w-[90%] md:w-[30%] flex-col items-center m-7 text-lime-300 h-[90vh]">
      <h1 className="text-3xl">{time}</h1>
      <div className="flex gap-3 mt-4">
        <button onClick={() => setFilterData(new Date(subDays(filterData, 1)))} >
          <ChevronLeft />
        </button>
        <h2
          className={`cursor-pointer ${!isToday(filterData) && 'text-pink-300'}`}
          onClick={() => setFilterData(date_now)}
        >
          {format(filterData, "dd/MM")}
        </h2>
        <button onClick={() => setFilterData(new Date(addDays(filterData, 1)))} >
          <ChevronRight />
        </button>

      </div>
      <div className="flex flex-col w-full justify-center items-center mt-8 gap-3 max-h-[75%] overflow-y-auto">
        {
          activities.map(act => (
            <div key={act.id} className="flex gap-3 items-center">
              <span title={act.description}>{act.startTime} - {act.endTime ?? "Working!"}</span>
              <div className="cursor-pointer" title={`Copy message: ${act.description}`} onClick={() => handleCopyMessage(act.description)}>
                <Copy size={15} />
              </div>
            </div>

          ))
        }
      </div>
      <div className="flex mt-auto w-full">
        <input
          className={`border border-lime-400 bg-transparent rounded-l w-full p-1 border-r-0 ${isMessageEmpty && 'border-red-500'}`}
          value={message}
          onChange={(event) => {
            if (isMessageEmpty)
              setIsMessageEmpty(false)

            setMessage(event.target.value)
          }}
        />
        <button
          className={`h-full w-[20%] 
            font-bold border 
            border-lime-400 
            rounded-r-md 
            hover:bg-lime-400 
            hover:text-black
            ${isMessageEmpty && 'border-red-500'}
          `}
          onClick={handleNewActivitie}
        >
          <span className="relative -top-[2px]">+</span>
        </button>
      </div>
    </div>
  );
}
